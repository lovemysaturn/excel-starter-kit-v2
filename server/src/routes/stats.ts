import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';

const router = Router();

// GET /api/stats — aggregated stats for dashboard charts
router.get('/', (_req: Request, res: Response) => {
    try {
        const db = getDb();

        // Items by category
        const itemsByCategory = db.prepare(`
            SELECT category as name, COUNT(*) as value
            FROM items WHERE category IS NOT NULL AND category != ''
            GROUP BY category ORDER BY value DESC LIMIT 8
        `).all();

        // Items by status
        const itemsByStatus = db.prepare(`
            SELECT status as name, COUNT(*) as value
            FROM items WHERE status IS NOT NULL AND status != ''
            GROUP BY status ORDER BY value DESC
        `).all();

        // Transactions by payment_status
        const txnByStatus = db.prepare(`
            SELECT payment_status as name, COUNT(*) as value
            FROM transactions WHERE payment_status IS NOT NULL AND payment_status != ''
            GROUP BY payment_status ORDER BY value DESC
        `).all();

        // Transactions: total amount by type
        const txnByType = db.prepare(`
            SELECT type as name, SUM(amount) as value, COUNT(*) as count
            FROM transactions WHERE type IS NOT NULL AND type != ''
            GROUP BY type ORDER BY value DESC
        `).all();

        // Tasks by status
        const tasksByStatus = db.prepare(`
            SELECT status as name, COUNT(*) as value
            FROM tasks WHERE status IS NOT NULL AND status != ''
            GROUP BY status ORDER BY value DESC
        `).all();

        // Tasks by priority
        const tasksByPriority = db.prepare(`
            SELECT priority as name, COUNT(*) as value
            FROM tasks WHERE priority IS NOT NULL AND priority != ''
            GROUP BY priority ORDER BY value DESC
        `).all();

        // Contacts by type
        const contactsByType = db.prepare(`
            SELECT type as name, COUNT(*) as value
            FROM contacts WHERE type IS NOT NULL AND type != ''
            GROUP BY type ORDER BY value DESC
        `).all();

        // Recent activity (last 7 days from change_log)
        const recentActivity = db.prepare(`
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM change_log
            WHERE created_at >= datetime('now', '-7 days')
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `).all();

        // Table totals
        const totals = {
            items: (db.prepare('SELECT COUNT(*) as c FROM items').get() as any).c,
            transactions: (db.prepare('SELECT COUNT(*) as c FROM transactions').get() as any).c,
            tasks: (db.prepare('SELECT COUNT(*) as c FROM tasks').get() as any).c,
            contacts: (db.prepare('SELECT COUNT(*) as c FROM contacts').get() as any).c,
        };

        res.json({
            totals,
            itemsByCategory,
            itemsByStatus,
            txnByStatus,
            txnByType,
            tasksByStatus,
            tasksByPriority,
            contactsByType,
            recentActivity,
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
