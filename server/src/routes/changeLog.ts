import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';

const router = Router();

// GET /api/change-log — query audit trail
router.get('/', (req: Request, res: Response) => {
    try {
        const { table, row_id, limit = '100' } = req.query;
        let sql = 'SELECT * FROM change_log';
        const conditions: string[] = [];
        const params: any[] = [];
        if (table) { conditions.push('table_name = ?'); params.push(table); }
        if (row_id) { conditions.push('row_id = ?'); params.push(Number(row_id)); }
        if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
        sql += ' ORDER BY created_at DESC LIMIT ?';
        params.push(Number(limit));
        const data = getDb().prepare(sql).all(...params);
        const total = (getDb().prepare('SELECT COUNT(*) as c FROM change_log').get() as any).c;
        res.json({ data, total });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /api/change-log/stats — summary stats
router.get('/stats', (_req: Request, res: Response) => {
    try {
        const today = (getDb().prepare(`SELECT COUNT(*) as c FROM change_log WHERE date(created_at) = date('now')`).get() as any).c;
        const week = (getDb().prepare(`SELECT COUNT(*) as c FROM change_log WHERE created_at >= datetime('now', '-7 days')`).get() as any).c;
        const total = (getDb().prepare('SELECT COUNT(*) as c FROM change_log').get() as any).c;
        const byTable = getDb().prepare('SELECT table_name, COUNT(*) as count FROM change_log GROUP BY table_name ORDER BY count DESC').all();
        const byAction = getDb().prepare('SELECT action, COUNT(*) as count FROM change_log GROUP BY action').all();
        res.json({ data: { today, week, total, byTable, byAction } });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
