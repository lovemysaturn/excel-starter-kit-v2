import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    try {
        const { unread } = req.query;
        let sql = 'SELECT * FROM alerts WHERE is_dismissed = 0';
        if (unread === 'true') sql += ' AND is_read = 0';
        sql += ' ORDER BY created_at DESC LIMIT 50';
        const data = getDb().prepare(sql).all();
        const count = (getDb().prepare('SELECT COUNT(*) as c FROM alerts WHERE is_read = 0 AND is_dismissed = 0').get() as any).c;
        res.json({ data, unreadCount: count });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/read', (req: Request, res: Response) => {
    try {
        getDb().prepare('UPDATE alerts SET is_read = 1 WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/dismiss', (req: Request, res: Response) => {
    try {
        getDb().prepare('UPDATE alerts SET is_dismissed = 1 WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export function runAlertScan() {
    const rules = [
        { id: 'zero-amount', title: 'Zero Amount Item', severity: 'warning', sql: `SELECT id FROM items WHERE (amount = 0 OR amount IS NULL) AND status = 'active'` },
        { id: 'overdue-task', title: 'Overdue Task', severity: 'error', sql: `SELECT id FROM tasks WHERE due_date < date('now') AND status NOT IN ('done','blocked')` },
        { id: 'pending-payment', title: 'Pending Payment', severity: 'info', sql: `SELECT id FROM transactions WHERE payment_status = 'pending' AND due_date < date('now')` },
    ];
    let inserted = 0;
    for (const rule of rules) {
        const rows = getDb().prepare(rule.sql).all() as any[];
        for (const row of rows) {
            const exists = getDb().prepare('SELECT 1 FROM alerts WHERE rule_id = ? AND item_id = ? AND is_dismissed = 0').get(rule.id, row.id);
            if (!exists) {
                getDb().prepare('INSERT INTO alerts (rule_id, item_id, title, severity) VALUES (?, ?, ?, ?)').run(rule.id, row.id, rule.title, rule.severity);
                inserted++;
            }
        }
    }
    const total = (getDb().prepare('SELECT COUNT(*) as c FROM alerts WHERE is_dismissed = 0').get() as any).c;
    return { inserted, total };
}

export default router;
