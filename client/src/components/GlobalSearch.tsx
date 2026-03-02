import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { apiGet } from '@/hooks/useApi';
import { Search, X, Table2, Receipt, ListTodo, Users, ArrowRight, Loader2 } from 'lucide-react';

const TABLE_META: Record<string, { label: string; labelHi: string; icon: React.ReactNode; path: string; color: string }> = {
    items: { label: 'Items', labelHi: 'आइटम', icon: <Table2 size={14} />, path: '/data', color: '#6366f1' },
    transactions: { label: 'Transactions', labelHi: 'लेनदेन', icon: <Receipt size={14} />, path: '/transactions', color: '#10b981' },
    tasks: { label: 'Tasks', labelHi: 'कार्य', icon: <ListTodo size={14} />, path: '/tasks', color: '#f59e0b' },
    contacts: { label: 'Contacts', labelHi: 'संपर्क', icon: <Users size={14} />, path: '/contacts', color: '#8b5cf6' },
};

// Columns to display for each table
const DISPLAY_COLS: Record<string, string[]> = {
    items: ['name', 'category', 'status', 'amount'],
    transactions: ['ref_no', 'party_name', 'amount', 'payment_status'],
    tasks: ['title', 'priority', 'status', 'assigned_to'],
    contacts: ['name', 'company', 'type', 'phone'],
};

export default function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { language } = useAppStore();
    const lbl = (en: string, hi: string) => language === 'hi' ? hi : en;
    const timerRef = useRef<any>(null);

    // Ctrl+Shift+F to open
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                setOpen(o => !o);
            }
            if (e.key === 'Escape' && open) setOpen(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open]);

    useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);

    // Debounced search
    const doSearch = useCallback((q: string) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (!q.trim()) { setResults([]); return; }
        timerRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await apiGet(`/search?q=${encodeURIComponent(q)}`);
                setResults(res.data || []);
            } catch { setResults([]); }
            setLoading(false);
        }, 250);
    }, []);

    useEffect(() => { doSearch(query); }, [query, doSearch]);

    const handleSelect = (row: any) => {
        const table = row._table;
        const meta = TABLE_META[table];
        if (meta) navigate(meta.path);
        setOpen(false);
        setQuery('');
    };

    // Highlight matching text
    const highlight = (text: string) => {
        if (!query || !text) return text;
        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <mark style={{ background: '#fde68a', borderRadius: 2, padding: '0 1px' }}>{text.slice(idx, idx + query.length)}</mark>
                {text.slice(idx + query.length)}
            </>
        );
    };

    // Group results by table
    const grouped = results.reduce<Record<string, any[]>>((acc, r) => {
        const t = r._table || 'unknown';
        if (!acc[t]) acc[t] = [];
        acc[t].push(r);
        return acc;
    }, {});

    if (!open) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={() => setOpen(false)}>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
            <div style={{ position: 'fixed', top: '12%', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 640, zIndex: 201 }}
                onClick={e => e.stopPropagation()}>

                {/* Search input */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                    borderRadius: '16px 16px 0 0', background: 'var(--color-card)', borderBottom: '2px solid var(--color-primary)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                }}>
                    <Search size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                    <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                        placeholder={lbl('Search across all tables...', 'सभी टेबल में खोजें...')}
                        style={{
                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                            fontSize: 15, color: 'var(--color-text)',
                        }} />
                    {loading && <Loader2 size={16} style={{ color: 'var(--color-text-muted)', animation: 'spin 0.6s linear infinite' }} />}
                    <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
                        <X size={16} />
                    </button>
                </div>

                {/* Results */}
                <div style={{
                    borderRadius: '0 0 16px 16px', background: 'var(--color-card)', maxHeight: 420, overflowY: 'auto',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                }}>
                    {query && results.length === 0 && !loading && (
                        <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                            {lbl('No results found', 'कोई परिणाम नहीं')}
                        </div>
                    )}

                    {Object.entries(grouped).map(([table, rows]) => {
                        const meta = TABLE_META[table];
                        if (!meta) return null;
                        const cols = DISPLAY_COLS[table] || [];
                        return (
                            <div key={table}>
                                {/* Table header */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                                    background: `${meta.color}10`, borderBottom: '1px solid var(--color-border)',
                                    position: 'sticky', top: 0,
                                }}>
                                    <span style={{ color: meta.color }}>{meta.icon}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>
                                        {language === 'hi' ? meta.labelHi : meta.label}
                                    </span>
                                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 4 }}>
                                        ({rows.length})
                                    </span>
                                </div>

                                {/* Rows */}
                                {rows.slice(0, 8).map((row: any, i: number) => (
                                    <div key={i} onClick={() => handleSelect(row)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', cursor: 'pointer',
                                            borderBottom: '1px solid var(--color-border)',
                                            transition: 'background 0.1s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <div style={{ flex: 1, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                            {cols.map(col => {
                                                const val = row[col];
                                                if (val === null || val === undefined || val === '') return null;
                                                return (
                                                    <div key={col} style={{ minWidth: 0 }}>
                                                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 1 }}>{col}</div>
                                                        <div style={{ fontSize: 13, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                                                            {highlight(String(val))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <ArrowRight size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                                    </div>
                                ))}
                            </div>
                        );
                    })}

                    {!query && (
                        <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                            <Search size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
                            <p>{lbl('Type to search items, transactions, tasks, contacts', 'आइटम, लेनदेन, कार्य, संपर्क खोजें')}</p>
                            <p style={{ fontSize: 11, marginTop: 4 }}>{lbl('Ctrl+Shift+F to toggle', 'Ctrl+Shift+F से खोलें')}</p>
                        </div>
                    )}
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
