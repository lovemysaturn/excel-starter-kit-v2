import { Router, Request, Response } from 'express';
import { getDb, closeDb, initDb } from '../db/connection';
import path from 'path';
import fs from 'fs';

const router = Router();
const BACKUP_DIR = path.join(__dirname, '../../../data/backups');

router.get('/', (_req: Request, res: Response) => {
    try {
        if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
        const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.db')).map(f => {
            const stat = fs.statSync(path.join(BACKUP_DIR, f));
            return { name: f, size: stat.size, created: stat.birthtime.toISOString() };
        }).sort((a, b) => b.created.localeCompare(a.created));
        const dbPath = path.join(__dirname, '../../../data/app.db');
        const dbSize = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;
        res.json({ data: files, dbSize });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/create', (_req: Request, res: Response) => {
    try {
        if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `backup-${ts}.db`;
        getDb().exec(`VACUUM INTO '${path.join(BACKUP_DIR, backupName).replace(/\\/g, '/')}'`);
        res.json({ success: true, name: backupName });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/restore', (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const backupPath = path.join(BACKUP_DIR, name);
        if (!fs.existsSync(backupPath)) return res.status(404).json({ error: 'Backup not found' });
        const dbPath = path.join(__dirname, '../../../data/app.db');
        closeDb();
        fs.copyFileSync(backupPath, dbPath);
        initDb();
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete('/:name', (req: Request, res: Response) => {
    try {
        const backupPath = path.join(BACKUP_DIR, req.params.name);
        if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
