import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
    try {
        const rules = [
            { id: 'missing-name', name: 'Missing Name', nameHi: 'नाम गायब', description: 'Items without a name', descriptionHi: 'बिना नाम के आइटम', severity: 'error', table: 'items', condition: `name IS NULL OR name = ''`, field: 'name' },
            { id: 'zero-amount', name: 'Zero Amount', nameHi: 'शून्य राशि', description: 'Records with zero amount', descriptionHi: 'शून्य राशि वाले रिकॉर्ड', severity: 'warning', table: 'items', condition: `amount = 0 OR amount IS NULL`, field: 'amount' },
            { id: 'missing-category', name: 'Missing Category', nameHi: 'श्रेणी गायब', description: 'Items without category', descriptionHi: 'बिना श्रेणी के', severity: 'warning', table: 'items', condition: `category IS NULL OR category = ''`, field: 'category' },
            { id: 'missing-party', name: 'Missing Party Name', nameHi: 'पार्टी नाम गायब', description: 'Transactions without party', descriptionHi: 'बिना पार्टी के लेनदेन', severity: 'error', table: 'transactions', condition: `party_name IS NULL OR party_name = ''`, field: 'party_name' },
            { id: 'overdue-tasks', name: 'Overdue Tasks', nameHi: 'अतिदेय कार्य', description: 'Tasks past due date', descriptionHi: 'देय तिथि बीत चुकी', severity: 'error', table: 'tasks', condition: `due_date < date('now') AND status NOT IN ('done','cancelled')`, field: 'due_date' },
        ];
        let errors = 0, warnings = 0, passed = 0;
        const result = rules.map(rule => {
            const rows = getDb().prepare(`SELECT id, * FROM ${rule.table} WHERE ${rule.condition} LIMIT 20`).all() as any[];
            const count = rows.length;
            if (count === 0) passed++; else if (rule.severity === 'error') errors++; else warnings++;
            return { ...rule, issueCount: count, affectedRows: rows.map(r => ({ ...r, field: rule.field, value: r[rule.field] })) };
        });
        res.json({ data: { rules: result, totalRules: rules.length, errors, warnings, passed } });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
