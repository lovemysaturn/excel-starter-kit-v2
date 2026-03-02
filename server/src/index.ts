import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDb, closeDb } from './db/connection';
import { createTableRouter } from './routes/genericTable';

// Routes
import settingsRouter from './routes/settings';
import workbooksRouter from './routes/workbooks';
import backupRouter from './routes/backup';
import documentsRouter from './routes/documents';
import fieldHealthRouter from './routes/fieldHealth';
import dataValidatorRouter from './routes/dataValidator';
import searchRouter from './routes/search';
import alertsRouter, { runAlertScan } from './routes/alerts';
import mastersRouter from './routes/masters';
import changeLogRouter from './routes/changeLog';
import importRouter from './routes/import';
import statsRouter from './routes/stats';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Data Table Routes (generic CRUD with audit) ───
app.use('/api/items', createTableRouter('items'));
app.use('/api/transactions', createTableRouter('transactions'));
app.use('/api/tasks', createTableRouter('tasks'));
app.use('/api/contacts', createTableRouter('contacts'));

// ─── Feature Routes ───
app.use('/api/settings', settingsRouter);
app.use('/api/workbooks', workbooksRouter);
app.use('/api/backup', backupRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/field-health', fieldHealthRouter);
app.use('/api/data-validator', dataValidatorRouter);
app.use('/api/search', searchRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/masters', mastersRouter);
app.use('/api/change-log', changeLogRouter);
app.use('/api/import', importRouter);
app.use('/api/stats', statsRouter);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString() });
});

// Serve static files (production)
const clientDistDev = path.join(__dirname, '../../client/dist');
const clientDistPortable = path.join(__dirname, '../public');
const clientDist = require('fs').existsSync(clientDistPortable) ? clientDistPortable : clientDistDev;
if (require('fs').existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
    });
}

// Start
async function start() {
    initDb();
    try {
        const result = runAlertScan();
        console.log(`🔔 Alert scan: ${result.inserted} new, ${result.total} total`);
    } catch (err) {
        console.error('⚠️ Initial alert scan failed:', err);
    }
    app.listen(PORT, () => {
        console.log(`\n📦 Excel Starter Kit v2 server at http://localhost:${PORT}`);
        console.log(`   API: /api/* | Health: /api/health\n`);
    });
}

start().catch(err => { console.error('Failed to start:', err); process.exit(1); });
process.on('SIGINT', () => { closeDb(); process.exit(0); });
process.on('SIGTERM', () => { closeDb(); process.exit(0); });

export default app;
