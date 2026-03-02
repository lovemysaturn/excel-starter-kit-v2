import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';

const router = Router();

// GET /api/settings
router.get('/', (_req: Request, res: Response) => {
    try {
        const rows = getDb().prepare('SELECT * FROM settings').all() as any[];
        const data: Record<string, string> = {};
        rows.forEach(r => { data[r.key] = r.value; });
        res.json({ data });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// PUT /api/settings
router.put('/', (req: Request, res: Response) => {
    try {
        const updates = req.body;
        const upsert = getDb().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
        const txn = getDb().transaction(() => {
            Object.entries(updates).forEach(([k, v]) => upsert.run(k, v as string));
        });
        txn();
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /api/settings/wisdom-points
router.get('/wisdom-points', (_req: Request, res: Response) => {
    try {
        const data = getDb().prepare('SELECT * FROM wisdom_points ORDER BY id').all();
        res.json({ data });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// GET /api/settings/wisdom-points/random
router.get('/wisdom-points/random', (_req: Request, res: Response) => {
    try {
        const row = getDb().prepare('SELECT * FROM wisdom_points WHERE is_active = 1 ORDER BY RANDOM() LIMIT 1').get();
        res.json({ data: row || null });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/settings/wisdom-points
router.post('/wisdom-points', (req: Request, res: Response) => {
    try {
        const { text, text_hi } = req.body;
        getDb().prepare('INSERT INTO wisdom_points (text, text_hi) VALUES (?, ?)').run(text, text_hi || '');
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// PUT /api/settings/wisdom-points/:id
router.put('/wisdom-points/:id', (req: Request, res: Response) => {
    try {
        const { is_active, text, text_hi } = req.body;
        if (is_active !== undefined) getDb().prepare('UPDATE wisdom_points SET is_active = ? WHERE id = ?').run(is_active, req.params.id);
        if (text !== undefined) getDb().prepare('UPDATE wisdom_points SET text = ? WHERE id = ?').run(text, req.params.id);
        if (text_hi !== undefined) getDb().prepare('UPDATE wisdom_points SET text_hi = ? WHERE id = ?').run(text_hi, req.params.id);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/settings/wisdom-points/:id
router.delete('/wisdom-points/:id', (req: Request, res: Response) => {
    try {
        getDb().prepare('DELETE FROM wisdom_points WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
