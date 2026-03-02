import { Router, Request, Response } from 'express';
import { getDb, logChange } from '../db/connection';

// ═══════════════════════════════════════════════════════════════
// Generic CRUD Route Factory — with Audit Trail
// Usage: app.use('/api/items', createTableRouter('items'));
// ═══════════════════════════════════════════════════════════════

export function createTableRouter(tableName: string) {
    const r = Router();

    // GET / — list all
    r.get('/', (req: Request, res: Response) => {
        try {
            const { search, sort = 'id', order = 'desc', limit = '200' } = req.query;
            let sql = `SELECT * FROM ${tableName}`;
            const params: any[] = [];

            if (search) {
                const columns = getDb().prepare(`PRAGMA table_info('${tableName}')`).all() as any[];
                const textCols = columns.filter(c => c.type.includes('TEXT')).map(c => c.name);
                if (textCols.length > 0) {
                    sql += ' WHERE ' + textCols.map(c => `"${c}" LIKE ?`).join(' OR ');
                    textCols.forEach(() => params.push(`%${search}%`));
                }
            }

            sql += ` ORDER BY "${sort}" ${order === 'asc' ? 'ASC' : 'DESC'} LIMIT ?`;
            params.push(Number(limit));

            const rows = getDb().prepare(sql).all(...params);
            const total = (getDb().prepare(`SELECT COUNT(*) as c FROM ${tableName}`).get() as any).c;
            res.json({ data: rows, total });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET /:id — single record
    r.get('/:id', (req: Request, res: Response) => {
        try {
            const row = getDb().prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(req.params.id);
            if (!row) return res.status(404).json({ error: 'Not found' });
            res.json({ data: row });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST / — create
    r.post('/', (req: Request, res: Response) => {
        try {
            const data = req.body;
            const keys = Object.keys(data).filter(k => k !== 'id');
            let result;

            if (keys.length === 0) {
                result = getDb().prepare(`INSERT INTO ${tableName} DEFAULT VALUES`).run();
            } else {
                const placeholders = keys.map(() => '?').join(', ');
                const values = keys.map(k => data[k]);
                result = getDb().prepare(
                    `INSERT INTO ${tableName} (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders})`
                ).run(...values);
            }

            const row = getDb().prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(result.lastInsertRowid);
            logChange(tableName, Number(result.lastInsertRowid), 'create');
            res.json({ success: true, data: row, id: result.lastInsertRowid });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    // PUT /:id — update row
    r.put('/:id', (req: Request, res: Response) => {
        try {
            const data = req.body;
            const keys = Object.keys(data).filter(k => k !== 'id');
            if (keys.length === 0) return res.json({ success: true });

            // Log each field change
            const existing = getDb().prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(req.params.id) as any;
            const sets = keys.map(k => `"${k}" = ?`).join(', ');
            const values = [...keys.map(k => data[k]), req.params.id];
            getDb().prepare(`UPDATE ${tableName} SET ${sets}, updated_at = datetime('now') WHERE id = ?`).run(...values);

            if (existing) {
                keys.forEach(k => {
                    if (String(existing[k]) !== String(data[k])) {
                        logChange(tableName, Number(req.params.id), 'update', k, String(existing[k] ?? ''), String(data[k] ?? ''));
                    }
                });
            }

            const row = getDb().prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(req.params.id);
            res.json({ success: true, data: row });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    // PUT /:id/cell — inline cell edit with audit
    r.put('/:id/cell', (req: Request, res: Response) => {
        try {
            const { column, value } = req.body;
            if (!column) return res.status(400).json({ error: 'column required' });

            const existing = getDb().prepare(`SELECT "${column}" as v FROM ${tableName} WHERE id = ?`).get(req.params.id) as any;
            const oldValue = existing ? String(existing.v ?? '') : '';

            getDb().prepare(`UPDATE ${tableName} SET "${column}" = ?, updated_at = datetime('now') WHERE id = ?`).run(value, req.params.id);
            logChange(tableName, Number(req.params.id), 'update', column, oldValue, String(value ?? ''));

            res.json({ success: true });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE /:id
    r.delete('/:id', (req: Request, res: Response) => {
        try {
            logChange(tableName, Number(req.params.id), 'delete');
            getDb().prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(req.params.id);
            res.json({ success: true });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST /bulk-delete
    r.post('/bulk-delete', (req: Request, res: Response) => {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'ids required' });
            ids.forEach(id => logChange(tableName, id, 'delete'));
            const placeholders = ids.map(() => '?').join(',');
            const result = getDb().prepare(`DELETE FROM ${tableName} WHERE id IN (${placeholders})`).run(...ids);
            res.json({ success: true, deleted: result.changes });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET /masters/options — distinct values for autocomplete
    r.get('/masters/options', (req: Request, res: Response) => {
        try {
            const columns = getDb().prepare(`PRAGMA table_info('${tableName}')`).all() as any[];
            const textCols = columns.filter(c =>
                c.type.includes('TEXT') && !['created_at', 'updated_at', 'notes', 'description', 'address'].includes(c.name)
            );
            const options: Record<string, string[]> = {};
            for (const col of textCols) {
                const masterRows = getDb().prepare(
                    `SELECT value FROM masters WHERE list_name = ? AND is_active = 1 ORDER BY sort_order`
                ).all(col.name) as any[];
                if (masterRows.length > 0) {
                    options[col.name] = masterRows.map(r => r.value);
                } else {
                    const rows = getDb().prepare(
                        `SELECT DISTINCT "${col.name}" as v FROM ${tableName} WHERE "${col.name}" IS NOT NULL AND "${col.name}" != '' ORDER BY v LIMIT 50`
                    ).all() as any[];
                    if (rows.length > 0) options[col.name] = rows.map(r => r.v);
                }
            }
            res.json(options);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    return r;
}
