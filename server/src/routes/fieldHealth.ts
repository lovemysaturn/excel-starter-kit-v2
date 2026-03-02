import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    try {
        const tableName = (req.query.table as string) || 'items';
        const columns = getDb().prepare(`PRAGMA table_info('${tableName}')`).all() as any[];
        const total = (getDb().prepare(`SELECT COUNT(*) as c FROM ${tableName}`).get() as any).c;
        const fields = columns.filter(c => !['id', 'created_at', 'updated_at'].includes(c.name)).map(col => {
            const filled = (getDb().prepare(`SELECT COUNT(*) as c FROM ${tableName} WHERE "${col.name}" IS NOT NULL AND "${col.name}" != '' AND "${col.name}" != '0'`).get() as any).c;
            const distinct = (getDb().prepare(`SELECT COUNT(DISTINCT "${col.name}") as c FROM ${tableName} WHERE "${col.name}" IS NOT NULL AND "${col.name}" != ''`).get() as any).c;
            return {
                column: col.name, type: col.type, total, filled, empty: total - filled,
                completeness: total > 0 ? Math.round((filled / total) * 100) : 0, distinct,
            };
        });
        const avgCompleteness = fields.length > 0 ? Math.round(fields.reduce((s, f) => s + f.completeness, 0) / fields.length) : 100;
        res.json({ data: { fields, total, avgCompleteness, tableName } });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/bulk-update', (req: Request, res: Response) => {
    try {
        const { table, column, value, condition_column, condition_value } = req.body;
        const result = getDb().prepare(`UPDATE ${table} SET "${column}" = ? WHERE "${condition_column}" = ?`).run(value, condition_value);
        res.json({ success: true, updated: result.changes });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
