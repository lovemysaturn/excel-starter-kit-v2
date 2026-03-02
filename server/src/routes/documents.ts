import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.join(__dirname, '../../../data/documents');
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        const ts = Date.now();
        cb(null, `${ts}-${file.originalname}`);
    },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

router.get('/all', (_req: Request, res: Response) => {
    try {
        const docs = getDb().prepare(`
            SELECT d.*, i.name as item_name FROM documents d LEFT JOIN items i ON d.item_id = i.id ORDER BY d.created_at DESC
        `).all();
        res.json({ data: docs });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/upload', upload.array('files', 10), (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];
        const { item_id, document_type } = req.body;
        const ins = getDb().prepare(`INSERT INTO documents (item_id, original_name, saved_name, document_type, size_bytes, file_path) VALUES (?,?,?,?,?,?)`);
        const inserted = files.map(f => {
            ins.run(item_id || null, f.originalname, f.filename, document_type || 'general', f.size, f.path);
            return f.originalname;
        });
        res.json({ success: true, uploaded: inserted });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/download', (req: Request, res: Response) => {
    try {
        const doc = getDb().prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as any;
        if (!doc) return res.status(404).json({ error: 'Not found' });
        const filePath = path.join(UPLOAD_DIR, doc.saved_name);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });
        res.download(filePath, doc.original_name);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', (req: Request, res: Response) => {
    try {
        const doc = getDb().prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as any;
        if (doc) {
            const filePath = path.join(UPLOAD_DIR, doc.saved_name);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        getDb().prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
