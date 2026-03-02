import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

const DATA_DIR = path.join(__dirname, '../../../data');
const DB_PATH = path.join(DATA_DIR, 'app.db');

export function initDb(): Database.Database {
    if (db) return db;

    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        db.exec(schema);
    }

    console.log(`✅ Database initialized at ${DB_PATH}`);
    return db;
}

export function getDb(): Database.Database {
    if (!db) return initDb();
    return db;
}

export function closeDb(): void {
    if (db) { db.close(); db = null; }
}

// ─── Audit Trail Helper ───
export function logChange(
    tableName: string,
    rowId: number,
    action: 'create' | 'update' | 'delete',
    columnName: string = '',
    oldValue: string = '',
    newValue: string = '',
    userName: string = 'system'
) {
    try {
        getDb().prepare(`
            INSERT INTO change_log (table_name, row_id, action, column_name, old_value, new_value, user_name)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(tableName, rowId, action, columnName, oldValue, newValue, userName);
    } catch (err) {
        console.error('Audit log failed:', err);
    }
}
