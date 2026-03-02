import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getDb } from '../db/connection';
import { analyzeUploadedFile, analyzeImport, executeImport, getImportableTables } from '../utils/smartImporter';

const router = Router();

// ─── Upload directory ───
const uploadDir = path.join(__dirname, '../../../data/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'import-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// GET /api/import/tables — list importable tables
router.get('/tables', (_req, res) => {
    try {
        res.json(getImportableTables());
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/import/upload — upload file, detect table, auto-map columns
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) throw new Error('No file uploaded');
        const expectedTable = req.body.expectedTable;
        const result = analyzeUploadedFile(req.file.path, expectedTable);
        res.json(result);
    } catch (err: any) {
        console.error('Import Upload Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/import/analyze — dry-run analysis
router.post('/analyze', async (req, res) => {
    try {
        const { filePath, mappings, targetTable, importMode } = req.body;
        const result = analyzeImport(filePath, mappings, targetTable, importMode);
        res.json(result);
    } catch (err: any) {
        console.error('Import Analyze Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/import/execute — run the actual import
router.post('/execute', async (req, res) => {
    try {
        const { filePath, mappings, targetTable, importMode } = req.body;
        const result = executeImport(filePath, mappings, targetTable, importMode);

        // Format errors for consistent frontend display
        const formattedErrors = (result.errors || []).map((e: string) => {
            const match = e.match(/Row (\d+): (.*)/);
            return { row: match ? parseInt(match[1]) : 0, error: match ? match[2] : e };
        });

        // Log the import
        const db = getDb();
        db.prepare(`
            INSERT INTO import_logs (file_name, target_table, total_rows, inserted, updated, skipped, failed, mapping_json, errors_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            path.basename(filePath),
            targetTable || 'unknown',
            result.totalRows || 0,
            result.inserted || 0,
            result.updated || 0,
            result.skipped || 0,
            result.failed || 0,
            JSON.stringify(mappings || []),
            JSON.stringify(formattedErrors)
        );

        res.json({ ...result, formattedErrors });
    } catch (err: any) {
        console.error('Import Execute Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/import/history
router.get('/history', (_req, res) => {
    try {
        const logs = getDb().prepare('SELECT * FROM import_logs ORDER BY created_at DESC').all();
        res.json(logs);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/import/history/:id
router.delete('/history/:id', (req, res) => {
    try {
        getDb().prepare('DELETE FROM import_logs WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/import/history — clear all
router.delete('/history', (_req, res) => {
    try {
        getDb().prepare('DELETE FROM import_logs').run();
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
