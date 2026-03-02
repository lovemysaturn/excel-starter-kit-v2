import * as XLSX from 'xlsx';
import path from 'path';
import { getDb, logChange } from '../db/connection';

// ═══════════════════════════════════════════════════════════════
// Generic Smart Importer — Schema-driven, works with any table
// ═══════════════════════════════════════════════════════════════

// Tables that can be imported into
const IMPORTABLE_TABLES = ['items', 'transactions', 'tasks', 'contacts'];

export function getImportableTables() {
    return IMPORTABLE_TABLES.map(t => {
        const cols = getDb().prepare(`PRAGMA table_info('${t}')`).all() as any[];
        return {
            key: t,
            name: t.charAt(0).toUpperCase() + t.slice(1),
            columns: cols.filter(c => !['id', 'created_at', 'updated_at'].includes(c.name)).map(c => c.name),
            totalColumns: cols.length,
        };
    });
}

// ─── Get table schema with alias/keyword hints ───
interface ColumnInfo {
    name: string;
    type: string;
    notnull: boolean;
    dflt_value: any;
    aliases: string[];
    keywords: string[];
}

export function getTableSchema(tableName: string): ColumnInfo[] {
    const cols = getDb().prepare(`PRAGMA table_info('${tableName}')`).all() as any[];
    return cols
        .filter(c => !['id', 'created_at', 'updated_at'].includes(c.name))
        .map(c => {
            const name: string = c.name;
            // Generate aliases and keywords from column name
            const aliases = generateAliases(name);
            const keywords = generateKeywords(name);
            return {
                name,
                type: c.type || 'TEXT',
                notnull: !!c.notnull,
                dflt_value: c.dflt_value,
                aliases,
                keywords,
            };
        });
}

// Generate common aliases for a column name
function generateAliases(colName: string): string[] {
    const aliases: string[] = [];
    // underscore → space: "party_name" → "party name"
    if (colName.includes('_')) {
        aliases.push(colName.replace(/_/g, ' '));
        // Title case: "Party Name"
        aliases.push(colName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
    }
    // camelCase splitting
    const camel = colName.replace(/([a-z])([A-Z])/g, '$1 $2');
    if (camel !== colName) aliases.push(camel, camel.toLowerCase());

    // Common abbreviation mappings
    const ABBR: Record<string, string[]> = {
        'ref_no': ['Reference No', 'Reference Number', 'Ref'],
        'amount': ['Amount', 'Amt', 'Total'],
        'qty': ['Quantity', 'Qty'],
        'date': ['Date'],
        'description': ['Description', 'Desc', 'Details'],
        'status': ['Status'],
        'type': ['Type', 'Category'],
        'notes': ['Notes', 'Remarks', 'Comments'],
        'name': ['Name'],
        'email': ['Email', 'E-mail'],
        'phone': ['Phone', 'Mobile', 'Contact'],
        'address': ['Address'],
        'city': ['City', 'Town'],
        'company': ['Company', 'Firm', 'Organization'],
        'gst_no': ['GST No', 'GST Number', 'GSTIN'],
        'pan_no': ['PAN No', 'PAN Number'],
        'bank_name': ['Bank Name', 'Bank'],
        'account_no': ['Account No', 'Account Number', 'A/C No'],
        'ifsc_code': ['IFSC Code', 'IFSC'],
        'assigned_to': ['Assigned To', 'Assignee', 'Owner'],
        'department': ['Department', 'Dept'],
        'priority': ['Priority'],
        'due_date': ['Due Date', 'Deadline'],
        'completed_at': ['Completed At', 'Completion Date'],
        'payment_mode': ['Payment Mode', 'Mode of Payment'],
        'payment_status': ['Payment Status'],
        'party_name': ['Party Name', 'Vendor', 'Customer', 'Client'],
        'total': ['Total', 'Grand Total'],
        'tax': ['Tax', 'GST', 'Tax Amount'],
        'location': ['Location', 'Place'],
        'category': ['Category', 'Type'],
        'unit': ['Unit', 'UOM'],
        'quantity': ['Quantity', 'Qty', 'Count'],
        'tags': ['Tags', 'Labels'],
        'title': ['Title', 'Subject'],
        'reference': ['Reference', 'Ref'],
    };

    // Check for exact column name or base name
    const baseName = colName.toLowerCase();
    if (ABBR[baseName]) aliases.push(...ABBR[baseName]);
    // Also check if column ends with a known suffix
    for (const [key, vals] of Object.entries(ABBR)) {
        if (baseName.endsWith(key) && baseName !== key) {
            aliases.push(...vals.map(v => colName.replace(new RegExp(key + '$', 'i'), '') + v));
        }
    }

    return [...new Set(aliases)];
}

// Generate search keywords from column name
function generateKeywords(colName: string): string[] {
    const words = colName.toLowerCase().split(/[_\s]+/);
    const keywords = [...words];
    // Add the full name
    keywords.push(colName.toLowerCase());
    return [...new Set(keywords.filter(k => k.length > 1))];
}

// ═══════════════════════════════════════════════════════════════
// File Type Detection — auto-detect target table from headers
// ═══════════════════════════════════════════════════════════════

function normalizeStr(s: string): string {
    return (s || '').trim().toLowerCase().replace(/[\s._\-]+/g, '');
}

export function detectTargetTable(headers: string[]): { table: string; confidence: number } {
    const scores: { table: string; score: number; total: number }[] = [];

    for (const tableName of IMPORTABLE_TABLES) {
        const schema = getTableSchema(tableName);
        let matched = 0;

        for (const col of schema) {
            const found = headers.some(h => {
                const nh = normalizeStr(h);
                // Exact match
                if (nh === normalizeStr(col.name)) return true;
                // Alias match
                if (col.aliases.some(a => normalizeStr(a) === nh)) return true;
                // Keyword match
                if (col.keywords.some(k => nh.includes(k) || k.includes(nh))) return true;
                return false;
            });
            if (found) matched++;
        }

        scores.push({ table: tableName, score: matched, total: schema.length });
    }

    scores.sort((a, b) => (b.score / b.total) - (a.score / a.total));
    const best = scores[0];
    return { table: best.table, confidence: best.total > 0 ? best.score / best.total : 0 };
}

// ═══════════════════════════════════════════════════════════════
// Column Matching (4-level: exact → alias → fuzzy → keyword)
// ═══════════════════════════════════════════════════════════════

export function autoMapColumns(headers: string[], tableName: string) {
    const schema = getTableSchema(tableName);
    const results: { source: string; target: string | null; confidence: number; method: string }[] = [];
    const usedTargets = new Set<string>();

    for (const header of headers) {
        const nh = normalizeStr(header);
        let bestMatch: { target: string; confidence: number; method: string } | null = null;

        for (const col of schema) {
            if (usedTargets.has(col.name)) continue;

            // Level 1: Exact match (100%)
            if (nh === normalizeStr(col.name)) {
                bestMatch = { target: col.name, confidence: 1.0, method: 'exact' };
                break;
            }

            // Level 2: Alias match (95%)
            if (col.aliases.some(a => normalizeStr(a) === nh || a.trim() === header.trim())) {
                bestMatch = { target: col.name, confidence: 0.95, method: 'alias' };
                break;
            }

            // Level 3: Fuzzy match (75%) — substring containment
            if (nh.length > 2) {
                const nc = normalizeStr(col.name);
                if (nc.includes(nh) || nh.includes(nc)) {
                    if (!bestMatch || bestMatch.confidence < 0.75) {
                        bestMatch = { target: col.name, confidence: 0.75, method: 'fuzzy' };
                    }
                }
            }

            // Level 4: Keyword match (55%)
            const matchedKw = col.keywords.filter(k => nh.includes(k));
            if (matchedKw.length > 0 && (!bestMatch || bestMatch.confidence < 0.55)) {
                bestMatch = { target: col.name, confidence: 0.55, method: 'keyword' };
            }
        }

        if (bestMatch) {
            usedTargets.add(bestMatch.target);
            results.push({ source: header, ...bestMatch });
        } else {
            results.push({ source: header, target: null, confidence: 0, method: 'unmapped' });
        }
    }

    return results;
}

// ═══════════════════════════════════════════════════════════════
// Data Parsing Utilities
// ═══════════════════════════════════════════════════════════════

function parseDate(val: any): string | null {
    if (!val) return null;
    if (typeof val === 'number') {
        const d = XLSX.SSF.parse_date_code(val);
        if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    }
    const s = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
    const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().substring(0, 10);
    return s || null;
}

function parseNumber(val: any): number {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/[₹,\s]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
}

function isNumericRow(row: any): boolean {
    const values = Object.values(row).filter(v => v !== '');
    if (values.length === 0) return true;
    return values.every(v => !isNaN(Number(v)));
}

function readExcelFile(filePath: string): any[] {
    const workbook = XLSX.readFile(filePath, { type: 'file', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    let data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    return data.filter(row => !isNumericRow(row));
}

// ═══════════════════════════════════════════════════════════════
// Analyze Uploaded File
// ═══════════════════════════════════════════════════════════════

export function analyzeUploadedFile(filePath: string, expectedTable?: string) {
    const jsonData = readExcelFile(filePath);
    const headers = jsonData.length > 0 ? Object.keys(jsonData[0] as any) : [];

    let detected = detectTargetTable(headers);
    if (expectedTable && IMPORTABLE_TABLES.includes(expectedTable)) {
        detected = { table: expectedTable, confidence: 1.0 };
    }

    const mappings = autoMapColumns(headers, detected.table);
    const schema = getTableSchema(detected.table);

    return {
        fileName: path.basename(filePath),
        filePath,
        sourceColumns: headers,
        totalRows: jsonData.length,
        preview: jsonData.slice(0, 20),
        mappings,
        targetColumns: schema.map(c => c.name),
        detectedTable: detected.table,
        detectedConfidence: detected.confidence,
        availableTables: getImportableTables(),
    };
}

// ═══════════════════════════════════════════════════════════════
// Pre-Import Analysis (dry run)
// ═══════════════════════════════════════════════════════════════

export function analyzeImport(filePath: string, mappings: any[], tableName: string, importMode?: string) {
    const jsonData = readExcelFile(filePath);
    const db = getDb();
    const activeMappings = mappings.filter((m: any) => m.target);
    const schema = getTableSchema(tableName);
    const schemaTypes: Record<string, string> = {};
    schema.forEach(c => { schemaTypes[c.name] = c.type; });

    let wouldInsert = 0, wouldUpdate = 0, wouldSkip = 0;
    const detailLog: string[] = [];

    // Find a unique key column (e.g. ref_no, email, name) for upsert
    const uniqueCol = findUniqueColumn(tableName);
    const uniqueMapping = uniqueCol ? activeMappings.find((m: any) => m.target === uniqueCol) : null;

    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;

        if (importMode === 'upsert' && uniqueMapping) {
            const val = String(row[uniqueMapping.source] ?? '').trim();
            if (!val) {
                wouldSkip++;
                detailLog.push(`Row ${i + 2}: Empty ${uniqueCol}, would skip`);
                continue;
            }
            const existing = db.prepare(`SELECT id FROM "${tableName}" WHERE "${uniqueCol}" = ?`).get(val);
            if (existing) wouldUpdate++;
            else wouldInsert++;
        } else {
            wouldInsert++;
        }
    }

    return { totalRows: jsonData.length, wouldInsert, wouldUpdate, wouldSkip, detailLog };
}

// ═══════════════════════════════════════════════════════════════
// Execute Import
// ═══════════════════════════════════════════════════════════════

export function executeImport(filePath: string, mappings: any[], tableName: string, importMode: string = 'insert') {
    const jsonData = readExcelFile(filePath);
    const db = getDb();
    const activeMappings = mappings.filter((m: any) => m.target);
    const schema = getTableSchema(tableName);
    const schemaTypes: Record<string, string> = {};
    const validColumns = new Set(schema.map(c => c.name));
    schema.forEach(c => { schemaTypes[c.name] = c.type; });

    let inserted = 0, updated = 0, skipped = 0, failed = 0;
    const errors: string[] = [];

    const uniqueCol = findUniqueColumn(tableName);
    const uniqueMapping = uniqueCol ? activeMappings.find((m: any) => m.target === uniqueCol) : null;

    function extractRow(row: any): Record<string, any> {
        const mapped: Record<string, any> = {};
        for (const m of activeMappings) {
            if (!validColumns.has(m.target)) continue;
            const val = row[m.source];
            const colType = (schemaTypes[m.target] || 'TEXT').toUpperCase();
            if (colType.includes('DATE') || m.target.includes('date') || m.target.endsWith('_at')) {
                mapped[m.target] = parseDate(val);
            } else if (colType.includes('REAL') || colType.includes('INT') || colType.includes('NUM')) {
                mapped[m.target] = parseNumber(val);
            } else {
                mapped[m.target] = val !== '' && val !== undefined ? String(val) : null;
            }
        }
        return mapped;
    }

    for (let i = 0; i < jsonData.length; i++) {
        try {
            const data = extractRow(jsonData[i]);
            const cols = Object.keys(data).filter(k => validColumns.has(k));
            if (cols.length === 0) { skipped++; continue; }

            if (importMode === 'upsert' && uniqueMapping && uniqueCol) {
                const uniqueVal = String(data[uniqueCol] ?? '').trim();
                if (!uniqueVal) {
                    errors.push(`Row ${i + 2}: Empty ${uniqueCol}, skipped`);
                    skipped++;
                    continue;
                }

                const existing = db.prepare(`SELECT id FROM "${tableName}" WHERE "${uniqueCol}" = ?`).get(uniqueVal) as any;
                if (existing) {
                    // Update
                    const setClauses = cols.filter(k => k !== uniqueCol).map(k => `"${k}" = ?`);
                    if (setClauses.length > 0) {
                        const values = cols.filter(k => k !== uniqueCol).map(k => data[k]);
                        values.push(existing.id);
                        db.prepare(`UPDATE "${tableName}" SET ${setClauses.join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...values);
                        logChange(tableName, existing.id, 'update');
                    }
                    updated++;
                } else {
                    // Insert
                    const placeholders = cols.map(() => '?').join(', ');
                    const values = cols.map(k => data[k]);
                    const result = db.prepare(`INSERT INTO "${tableName}" (${cols.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders})`).run(...values);
                    logChange(tableName, Number(result.lastInsertRowid), 'create');
                    inserted++;
                }
            } else {
                // Simple insert
                const placeholders = cols.map(() => '?').join(', ');
                const values = cols.map(k => data[k]);
                const result = db.prepare(`INSERT INTO "${tableName}" (${cols.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders})`).run(...values);
                logChange(tableName, Number(result.lastInsertRowid), 'create');
                inserted++;
            }
        } catch (err: any) {
            errors.push(`Row ${i + 2}: ${err.message}`);
            failed++;
        }
    }

    return { success: errors.length === 0, totalRows: jsonData.length, inserted, updated, skipped, failed, errors };
}

// ─── Find a likely unique column for upsert ───
function findUniqueColumn(tableName: string): string | null {
    const schema = getTableSchema(tableName);
    const names = schema.map(c => c.name);
    // Known unique-ish columns
    const candidates = ['ref_no', 'email', 'name', 'title'];
    for (const c of candidates) {
        if (names.includes(c)) return c;
    }
    return null;
}
