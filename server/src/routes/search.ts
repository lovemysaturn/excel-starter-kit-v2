import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    try {
        const q = req.query.q as string;
        if (!q) return res.json({ data: [] });
        const tables = ['items', 'transactions', 'tasks', 'contacts'];
        const results: any[] = [];
        for (const table of tables) {
            const cols = getDb().prepare(`PRAGMA table_info('${table}')`).all() as any[];
            const textCols = cols.filter(c => c.type.includes('TEXT')).map(c => c.name);
            if (textCols.length === 0) continue;
            const where = textCols.map(c => `"${c}" LIKE ?`).join(' OR ');
            const params = textCols.map(() => `%${q}%`);
            const rows = getDb().prepare(`SELECT *, '${table}' as _table FROM ${table} WHERE ${where} LIMIT 10`).all(...params) as any[];
            results.push(...rows);
        }
        res.json({ data: results.slice(0, 30) });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
