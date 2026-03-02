-- ═══════════════════════════════════════════════════════════════
-- Excel Starter Kit v2 — Schema with Audit Trail
-- ═══════════════════════════════════════════════════════════════

-- ─── TABLE 1: Items ───
CREATE TABLE IF NOT EXISTS items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL DEFAULT '',
    category    TEXT DEFAULT '',
    status      TEXT DEFAULT 'active',
    amount      REAL DEFAULT 0,
    quantity    INTEGER DEFAULT 0,
    unit        TEXT DEFAULT '',
    date        TEXT DEFAULT '',
    assigned_to TEXT DEFAULT '',
    location    TEXT DEFAULT '',
    notes       TEXT DEFAULT '',
    tags        TEXT DEFAULT '',
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

-- ─── TABLE 2: Transactions ───
CREATE TABLE IF NOT EXISTS transactions (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    ref_no         TEXT DEFAULT '',
    type           TEXT DEFAULT 'payment',
    party_name     TEXT DEFAULT '',
    description    TEXT DEFAULT '',
    amount         REAL DEFAULT 0,
    tax            REAL DEFAULT 0,
    total          REAL DEFAULT 0,
    payment_mode   TEXT DEFAULT '',
    payment_status TEXT DEFAULT 'pending',
    date           TEXT DEFAULT '',
    due_date       TEXT DEFAULT '',
    reference      TEXT DEFAULT '',
    notes          TEXT DEFAULT '',
    created_at     TEXT DEFAULT (datetime('now')),
    updated_at     TEXT DEFAULT (datetime('now'))
);

-- ─── TABLE 3: Tasks ───
CREATE TABLE IF NOT EXISTS tasks (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT NOT NULL DEFAULT '',
    description  TEXT DEFAULT '',
    priority     TEXT DEFAULT 'medium',
    status       TEXT DEFAULT 'open',
    assigned_to  TEXT DEFAULT '',
    department   TEXT DEFAULT '',
    due_date     TEXT DEFAULT '',
    completed_at TEXT DEFAULT '',
    tags         TEXT DEFAULT '',
    notes        TEXT DEFAULT '',
    created_at   TEXT DEFAULT (datetime('now')),
    updated_at   TEXT DEFAULT (datetime('now'))
);

-- ─── TABLE 4: Contacts ───
CREATE TABLE IF NOT EXISTS contacts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL DEFAULT '',
    company      TEXT DEFAULT '',
    type         TEXT DEFAULT 'vendor',
    email        TEXT DEFAULT '',
    phone        TEXT DEFAULT '',
    address      TEXT DEFAULT '',
    city         TEXT DEFAULT '',
    gst_no       TEXT DEFAULT '',
    pan_no       TEXT DEFAULT '',
    bank_name    TEXT DEFAULT '',
    account_no   TEXT DEFAULT '',
    ifsc_code    TEXT DEFAULT '',
    notes        TEXT DEFAULT '',
    is_active    INTEGER DEFAULT 1,
    created_at   TEXT DEFAULT (datetime('now')),
    updated_at   TEXT DEFAULT (datetime('now'))
);

-- ═══════════════════════════════════════════════════════════════
-- AUDIT TRAIL — who changed what, when
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS change_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name  TEXT NOT NULL,
    row_id      INTEGER NOT NULL,
    action      TEXT NOT NULL,          -- 'create', 'update', 'delete'
    column_name TEXT DEFAULT '',
    old_value   TEXT DEFAULT '',
    new_value   TEXT DEFAULT '',
    user_name   TEXT DEFAULT 'system',
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_changelog_table ON change_log(table_name, row_id);
CREATE INDEX IF NOT EXISTS idx_changelog_time ON change_log(created_at);

-- ─── Import Logs ───
CREATE TABLE IF NOT EXISTS import_logs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name     TEXT NOT NULL,
    target_table  TEXT NOT NULL,
    total_rows    INTEGER DEFAULT 0,
    inserted      INTEGER DEFAULT 0,
    updated       INTEGER DEFAULT 0,
    skipped       INTEGER DEFAULT 0,
    failed        INTEGER DEFAULT 0,
    mapping_json  TEXT DEFAULT '[]',
    errors_json   TEXT DEFAULT '[]',
    created_at    TEXT DEFAULT (datetime('now'))
);

-- ═══════════════════════════════════════════════════════════════
-- Supporting Tables
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT DEFAULT ''
);

INSERT OR IGNORE INTO settings (key, value) VALUES
    ('app_name', 'Excel Starter Kit v2'),
    ('language', 'en'),
    ('theme', 'light'),
    ('wisdom_enabled', 'true'),
    ('wisdom_interval', '30'),
    ('wisdom_dismiss_sec', '60'),
    ('auto_backup', 'false'),
    ('rows_per_page', '100');

CREATE TABLE IF NOT EXISTS mini_workbooks (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    name_hi     TEXT DEFAULT '',
    icon        TEXT DEFAULT '📋',
    table_name  TEXT DEFAULT 'items',
    columns     TEXT DEFAULT '[]',
    filters     TEXT DEFAULT '[]',
    hard_filters TEXT DEFAULT '[]',
    sort_col    TEXT DEFAULT 'id',
    sort_dir    TEXT DEFAULT 'desc',
    is_prebuilt INTEGER DEFAULT 0,
    is_hidden   INTEGER DEFAULT 0,
    is_pinned   INTEGER DEFAULT 0,
    section     TEXT DEFAULT 'other',
    created_at  TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO mini_workbooks (id, name, name_hi, icon, table_name, columns, filters, sort_col, is_prebuilt, section) VALUES
    ('all-items', 'All Items', 'सभी आइटम', '📦', 'items',
     '["name","category","status","amount","quantity","date","assigned_to","location"]',
     '[]', 'updated_at', 1, 'data'),
    ('active-items', 'Active Items', 'सक्रिय आइटम', '✅', 'items',
     '["name","category","amount","quantity","date","assigned_to"]',
     '[{"column":"status","operator":"=","value":"active"}]', 'date', 1, 'data'),
    ('pending-txn', 'Pending Payments', 'लंबित भुगतान', '⏳', 'transactions',
     '["ref_no","party_name","amount","total","payment_status","due_date"]',
     '[{"column":"payment_status","operator":"=","value":"pending"}]', 'due_date', 1, 'data');

CREATE TABLE IF NOT EXISTS documents (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id        INTEGER,
    original_name  TEXT NOT NULL,
    saved_name     TEXT NOT NULL,
    document_type  TEXT DEFAULT 'general',
    size_bytes     INTEGER DEFAULT 0,
    file_path      TEXT DEFAULT '',
    created_at     TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS alerts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_id     TEXT NOT NULL,
    item_id     INTEGER,
    title       TEXT NOT NULL,
    message     TEXT DEFAULT '',
    severity    TEXT DEFAULT 'info',
    is_read     INTEGER DEFAULT 0,
    is_dismissed INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wisdom_points (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    text      TEXT NOT NULL,
    text_hi   TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO wisdom_points (id, text, text_hi) VALUES
    (1, 'Focus on what matters most today.', 'आज जो सबसे ज़रूरी है उस पर ध्यान दो।'),
    (2, 'Small consistent steps beat big occasional leaps.', 'छोटे लगातार कदम बड़ी छलांग से बेहतर हैं।'),
    (3, 'Data-driven decisions lead to better outcomes.', 'डेटा-आधारित निर्णय बेहतर परिणाम देते हैं।');

CREATE TABLE IF NOT EXISTS masters (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    list_name TEXT NOT NULL,
    value     TEXT NOT NULL,
    value_hi  TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    is_active  INTEGER DEFAULT 1
);

INSERT OR IGNORE INTO masters (id, list_name, value, value_hi, sort_order) VALUES
    (1, 'category', 'Electronics', 'इलेक्ट्रॉनिक्स', 1),
    (2, 'category', 'Furniture', 'फर्नीचर', 2),
    (3, 'category', 'Stationery', 'स्टेशनरी', 3),
    (4, 'category', 'Equipment', 'उपकरण', 4),
    (5, 'category', 'Supplies', 'आपूर्ति', 5),
    (6, 'status', 'active', 'सक्रिय', 1),
    (7, 'status', 'pending', 'लंबित', 2),
    (8, 'status', 'completed', 'पूर्ण', 3),
    (9, 'status', 'cancelled', 'रद्द', 4),
    (10, 'location', 'Warehouse A', 'गोदाम A', 1),
    (11, 'location', 'Warehouse B', 'गोदाम B', 2),
    (12, 'location', 'Office', 'कार्यालय', 3),
    (20, 'type', 'payment', 'भुगतान', 1),
    (21, 'type', 'invoice', 'चालान', 2),
    (22, 'type', 'receipt', 'रसीद', 3),
    (23, 'type', 'refund', 'वापसी', 4),
    (24, 'payment_mode', 'cash', 'नकद', 1),
    (25, 'payment_mode', 'bank', 'बैंक', 2),
    (26, 'payment_mode', 'upi', 'UPI', 3),
    (27, 'payment_mode', 'cheque', 'चेक', 4),
    (28, 'payment_status', 'pending', 'लंबित', 1),
    (29, 'payment_status', 'paid', 'भुगतान', 2),
    (30, 'payment_status', 'partial', 'आंशिक', 3),
    (31, 'payment_status', 'cancelled', 'रद्द', 4),
    (40, 'priority', 'low', 'कम', 1),
    (41, 'priority', 'medium', 'मध्यम', 2),
    (42, 'priority', 'high', 'उच्च', 3),
    (43, 'priority', 'critical', 'गंभीर', 4),
    (44, 'task_status', 'open', 'खुला', 1),
    (45, 'task_status', 'in_progress', 'प्रगति में', 2),
    (46, 'task_status', 'done', 'पूर्ण', 3),
    (47, 'task_status', 'blocked', 'अवरुद्ध', 4),
    (48, 'department', 'IT', 'आईटी', 1),
    (49, 'department', 'Admin', 'प्रशासन', 2),
    (50, 'department', 'Finance', 'वित्त', 3),
    (51, 'department', 'Procurement', 'खरीद', 4),
    (60, 'contact_type', 'vendor', 'विक्रेता', 1),
    (61, 'contact_type', 'client', 'ग्राहक', 2),
    (62, 'contact_type', 'employee', 'कर्मचारी', 3),
    (63, 'contact_type', 'other', 'अन्य', 4);

-- ═══════════════════════════════════════════════════════════════
-- Sample Data
-- ═══════════════════════════════════════════════════════════════

INSERT OR IGNORE INTO items (id, name, category, status, amount, quantity, unit, date, assigned_to, location, notes) VALUES
    (1, 'Laptop Dell Inspiron', 'Electronics', 'active', 65000, 5, 'pcs', '2026-01-15', 'Rajesh Kumar', 'Office', 'For new team members'),
    (2, 'Office Chairs', 'Furniture', 'active', 12000, 10, 'pcs', '2026-01-20', 'Amit Singh', 'Warehouse A', 'Ergonomic chairs'),
    (3, 'A4 Paper Ream', 'Stationery', 'completed', 350, 100, 'packs', '2026-02-01', 'Priya Sharma', 'Office', 'Monthly supply'),
    (4, 'Projector Epson', 'Electronics', 'pending', 45000, 2, 'pcs', '2026-02-10', 'Vikram Patel', 'Warehouse B', 'Conference room'),
    (5, 'Standing Desk', 'Furniture', 'active', 28000, 3, 'pcs', '2026-02-15', 'Neha Gupta', 'Office', 'Height adjustable'),
    (6, 'Printer HP LaserJet', 'Equipment', 'active', 18500, 2, 'pcs', '2026-02-20', 'Suresh Verma', 'Office', 'Color laser'),
    (7, 'Whiteboard Markers', 'Stationery', 'active', 150, 50, 'pcs', '2026-02-22', 'Priya Sharma', 'Office', 'Assorted colors'),
    (8, 'Network Switch', 'Electronics', 'completed', 8500, 4, 'pcs', '2026-02-25', 'Rajesh Kumar', 'Warehouse A', '24-port managed');

INSERT OR IGNORE INTO transactions (id, ref_no, type, party_name, description, amount, tax, total, payment_mode, payment_status, date, due_date, notes) VALUES
    (1, 'TXN-001', 'invoice', 'ABC Suppliers', 'Laptop procurement', 325000, 58500, 383500, 'bank', 'paid', '2026-01-15', '2026-02-15', 'PO ref #1024'),
    (2, 'TXN-002', 'payment', 'Furniture World', 'Office chairs', 120000, 21600, 141600, 'cheque', 'paid', '2026-01-20', '2026-02-20', 'Cheque #4521'),
    (3, 'TXN-003', 'invoice', 'Paper Plus', 'Stationery', 35000, 6300, 41300, 'upi', 'pending', '2026-02-01', '2026-03-01', 'Monthly contract'),
    (4, 'TXN-004', 'payment', 'TechMart India', 'Projectors', 90000, 16200, 106200, 'bank', 'partial', '2026-02-10', '2026-03-10', 'EMI 1/3'),
    (5, 'TXN-005', 'receipt', 'Rajesh Kumar', 'Advance return', 5000, 0, 5000, 'cash', 'paid', '2026-02-15', '', 'Travel advance refund');

INSERT OR IGNORE INTO tasks (id, title, description, priority, status, assigned_to, department, due_date, notes) VALUES
    (1, 'Setup new workstations', 'Configure 5 laptops', 'high', 'in_progress', 'Rajesh Kumar', 'IT', '2026-02-28', 'Windows 11 + Office 365'),
    (2, 'Annual inventory audit', 'Count and verify all inventory', 'high', 'open', 'Amit Singh', 'Admin', '2026-03-15', 'Use barcode scanner'),
    (3, 'Update vendor database', 'Add new vendors', 'medium', 'open', 'Priya Sharma', 'Procurement', '2026-03-10', ''),
    (4, 'Fix conference projector', 'Color issues', 'critical', 'blocked', 'Vikram Patel', 'IT', '2026-03-05', 'Waiting for replacement'),
    (5, 'Process pending invoices', 'Clear Q1 backlog', 'high', 'in_progress', 'Suresh Verma', 'Finance', '2026-03-01', '3 of 8 done');

INSERT OR IGNORE INTO contacts (id, name, company, type, email, phone, address, city, gst_no, notes) VALUES
    (1, 'Rajesh Kumar', 'ABC Suppliers', 'vendor', 'rajesh@abc.com', '9876543210', '123 MG Road', 'Mumbai', '27AAACB1234A1ZV', 'Electronics vendor'),
    (2, 'Amit Singh', 'Furniture World', 'vendor', 'amit@fworld.com', '9876543211', '45 Park Street', 'Delhi', '07BBADF5678B2ZX', 'Furniture supplier'),
    (3, 'Priya Sharma', 'Paper Plus', 'vendor', 'priya@paperplus.in', '9876543212', '78 Station Road', 'Jaipur', '08CCPPS9012C3ZY', 'Stationery'),
    (4, 'Vikram Patel', 'TechMart India', 'vendor', 'vikram@techmart.in', '9876543213', '12 Cyber Hub', 'Gurgaon', '06DDTMI3456D4ZW', 'AV equipment'),
    (5, 'Anita Desai', 'Acme Corp', 'client', 'anita@acme.co', '9876543216', '34 Bandra West', 'Mumbai', '27GGACC5678G7ZS', 'Enterprise client');
