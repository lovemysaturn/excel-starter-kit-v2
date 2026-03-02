import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    try {
        const { list_name } = req.query;
        let sql = 'SELECT * FROM masters';
        const params: any[] = [];
        if (list_name) { sql += ' WHERE list_name = ?'; params.push(list_name); }
        sql += ' ORDER BY list_name, sort_order';
        res.json({ data: getDb().prepare(sql).all(...params) });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/', (req: Request, res: Response) => {
    try {
        const { list_name, value, value_hi, sort_order } = req.body;
        getDb().prepare('INSERT INTO masters (list_name, value, value_hi, sort_order) VALUES (?, ?, ?, ?)').run(list_name, value, value_hi || '', sort_order || 0);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', (req: Request, res: Response) => {
    try {
        getDb().prepare('DELETE FROM masters WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
