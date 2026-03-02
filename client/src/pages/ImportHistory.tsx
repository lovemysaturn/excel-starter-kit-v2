import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { apiGet, apiDelete } from '@/hooks/useApi';
import { toast } from 'sonner';
import { History, Trash2, FileSpreadsheet, Database, Upload, X } from 'lucide-react';

interface ImportLog {
    id: number;
    file_name: string;
    target_table: string;
    total_rows: number;
    inserted: number;
    updated: number;
    skipped: number;
    failed: number;
    created_at: string;
}

export default function ImportHistory() {
    const { language } = useAppStore();
    const navigate = useNavigate();
    const lbl = (en: string, hi: string) => language === 'hi' ? hi : en;
    const [logs, setLogs] = useState<ImportLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await apiGet('/import/history');
            setLogs(Array.isArray(data) ? data : []);
        } catch { setLogs([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchLogs(); }, []);

    const handleDelete = async (id: number) => {
        if (!confirm(lbl('Delete this import log?', 'यह आयात लॉग हटाएं?'))) return;
        try { await apiDelete(`/import/history/${id}`); toast.success('Log deleted'); fetchLogs(); }
        catch { toast.error('Failed to delete'); }
    };

    const handleClearAll = async () => {
        if (!confirm(lbl('Clear all import history?', 'सभी आयात इतिहास साफ करें?'))) return;
        try { await apiDelete('/import/history'); toast.success('History cleared'); fetchLogs(); }
        catch { toast.error('Failed to clear'); }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr + 'Z').getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return lbl('Just now', 'अभी');
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div style={{ height: '100%', overflow: 'auto', padding: 24, background: 'var(--color-bg)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ padding: 10, borderRadius: 12, background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
                        <History size={22} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                            {lbl('Import History', 'आयात इतिहास')}
                        </h2>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                            {logs.length} {lbl('imports', 'आयात')}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => navigate('/import')}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                        <Upload size={14} /> {lbl('New Import', 'नया आयात')}
                    </button>
                    {logs.length > 0 && (
                        <button onClick={handleClearAll}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                            <Trash2 size={14} /> {lbl('Clear All', 'सब साफ')}
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)', fontSize: 14 }}>
                    {lbl('Loading...', 'लोड हो रहा है...')}
                </div>
            ) : logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)' }}>
                    <FileSpreadsheet size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p style={{ fontSize: 14 }}>{lbl('No import history yet', 'अभी तक कोई आयात इतिहास नहीं')}</p>
                </div>
            ) : (
                <div style={{ borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: 'var(--color-surface)', borderBottom: '2px solid var(--color-primary)' }}>
                                {[lbl('File', 'फाइल'), lbl('Table', 'टेबल'), lbl('Total', 'कुल'), lbl('Inserted', 'नया'), lbl('Updated', 'अपडेट'), lbl('Failed', 'असफल'), lbl('When', 'कब'), ''].map((h, i) => (
                                    <th key={i} style={{ textAlign: i >= 2 && i <= 5 ? 'center' : 'left', padding: '10px 12px', fontWeight: 600, color: 'var(--color-text)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '10px 12px', color: 'var(--color-text)' }}>
                                        <FileSpreadsheet size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6, color: '#059669' }} />
                                        {log.file_name}
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'var(--color-primary-soft)', color: 'var(--color-primary)', fontWeight: 600 }}>
                                            {log.target_table}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: 'var(--color-text)' }}>{log.total_rows}</td>
                                    <td style={{ textAlign: 'center', padding: '10px 12px', color: '#059669', fontWeight: 600 }}>{log.inserted}</td>
                                    <td style={{ textAlign: 'center', padding: '10px 12px', color: '#d97706', fontWeight: 600 }}>{log.updated}</td>
                                    <td style={{ textAlign: 'center', padding: '10px 12px', color: log.failed > 0 ? '#dc2626' : 'var(--color-text-muted)', fontWeight: log.failed > 0 ? 600 : 400 }}>{log.failed}</td>
                                    <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--color-text-muted)' }}>{timeAgo(log.created_at)}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                        <button onClick={() => handleDelete(log.id)}
                                            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6 }}
                                            title={lbl('Delete', 'हटाएं')}>
                                            <X size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
