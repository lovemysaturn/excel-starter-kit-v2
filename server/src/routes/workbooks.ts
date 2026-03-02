import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
    try {
        const data = getDb().prepare('SELECT * FROM mini_workbooks ORDER BY is_pinned DESC, section, name').all();
        res.json({ data });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/', (req: Request, res: Response) => {
    try {
        const { id, name, name_hi, icon, table_name, columns, filters, hard_filters, sort_col, sort_dir, section } = req.body;
        const wbId = id || `wb-${Date.now()}`;
        getDb().prepare(`INSERT INTO mini_workbooks (id, name, name_hi, icon, table_name, columns, filters, hard_filters, sort_col, sort_dir, section)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
            wbId, name, name_hi || '', icon || '📋', table_name || 'items',
            JSON.stringify(columns || []), JSON.stringify(filters || []), JSON.stringify(hard_filters || []),
            sort_col || 'id', sort_dir || 'desc', section || 'other'
        );
        res.json({ success: true, id: wbId });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', (req: Request, res: Response) => {
    try {
        const data = req.body;
        const keys = Object.keys(data).filter(k => k !== 'id');
        if (keys.length === 0) return res.json({ success: true });
        const sets = keys.map(k => {
            const val = typeof data[k] === 'object' ? JSON.stringify(data[k]) : data[k];
            return `"${k}" = '${val}'`;
        }).join(', ');
        getDb().prepare(`UPDATE mini_workbooks SET ${sets} WHERE id = ?`).run(req.params.id);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', (req: Request, res: Response) => {
    try {
        getDb().prepare('DELETE FROM mini_workbooks WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
