import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { apiPost, apiGet } from '@/hooks/useApi';
import { toast } from 'sonner';
import {
    Upload, ArrowRight, ArrowLeft, Check, AlertCircle, AlertTriangle,
    Zap, X, ChevronDown, Database, FileSpreadsheet, CheckCircle2,
    Package, CreditCard, ClipboardList, Users
} from 'lucide-react';

type Step = 'upload' | 'map' | 'review' | 'done';

interface ColumnMapping {
    source: string;
    target: string | null;
    method: string;
    confidence: number;
}

interface Analysis {
    totalRows: number;
    wouldInsert: number;
    wouldUpdate: number;
    wouldSkip: number;
    detailLog?: string[];
}

const TABLE_ICONS: Record<string, React.ReactNode> = {
    items: <Package size={16} />,
    transactions: <CreditCard size={16} />,
    tasks: <ClipboardList size={16} />,
    contacts: <Users size={16} />,
};

export default function SmartImport() {
    const { language } = useAppStore();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const lbl = (en: string, hi: string) => language === 'hi' ? hi : en;

    const [step, setStep] = useState<Step>('upload');
    const [loading, setLoading] = useState(false);
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Upload state
    const [availableTables, setAvailableTables] = useState<any[]>([]);
    const [selectedTable, setSelectedTable] = useState(searchParams.get('target') || '');
    const [uploadResult, setUploadResult] = useState<any>(null);
    const [mappings, setMappings] = useState<ColumnMapping[]>([]);
    const [importMode, setImportMode] = useState('insert');

    // Analysis & results
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [importResult, setImportResult] = useState<any>(null);

    // Load available tables on mount
    React.useEffect(() => {
        apiGet('/import/tables').then(setAvailableTables).catch(() => { });
    }, []);

    const handleFileSelect = async (file: File) => {
        if (!file) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (selectedTable) formData.append('expectedTable', selectedTable);

            const res = await fetch('/api/import/upload', { method: 'POST', body: formData });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
            const data = await res.json();

            setUploadResult(data);
            setMappings(data.mappings || []);
            if (!selectedTable) setSelectedTable(data.detectedTable);
            setStep('map');
            toast.success(`${data.totalRows} rows detected`);
        } catch (err: any) {
            toast.error(err.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleMappingChange = (idx: number, target: string | null) => {
        setMappings(prev => prev.map((m, i) =>
            i === idx ? { ...m, target, method: target ? 'manual' : 'unmapped', confidence: target ? 1.0 : 0 } : m
        ));
    };

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const res = await apiPost('/import/analyze', {
                filePath: uploadResult.filePath,
                mappings,
                targetTable: selectedTable,
                importMode,
            });
            setAnalysis(res);
            setStep('review');
        } catch (err: any) {
            toast.error(err.message || 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    const handleExecuteImport = async () => {
        setLoading(true);
        try {
            const res = await apiPost('/import/execute', {
                filePath: uploadResult.filePath,
                mappings,
                targetTable: selectedTable,
                importMode,
            });
            setImportResult(res);
            setStep('done');
            toast.success(`Imported ${res.inserted} rows`);
        } catch (err: any) {
            toast.error(err.message || 'Import failed');
        } finally {
            setLoading(false);
        }
    };

    const getConfidenceColor = (c: number) => {
        if (c >= 0.95) return '#059669';
        if (c >= 0.7) return '#d97706';
        if (c > 0) return '#ea580c';
        return '#94a3b8';
    };

    const getMethodBadge = (method: string, confidence: number) => {
        const color = getConfidenceColor(confidence);
        const labels: Record<string, string> = {
            exact: '✓ Exact', alias: '≈ Alias', fuzzy: '~ Fuzzy',
            keyword: '◈ Keyword', manual: '✎ Manual', unmapped: '— Skip',
        };
        return (
            <span style={{ color, fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: `${color}15`, border: `1px solid ${color}30` }}>
                {labels[method] || method}
            </span>
        );
    };

    // ─── STEP: Upload ───
    const renderUpload = () => (
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
            {/* Table selector */}
            <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6, display: 'block' }}>
                    {lbl('Target Table', 'लक्ष्य टेबल')}
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {availableTables.map((t: any) => (
                        <button key={t.key} onClick={() => setSelectedTable(t.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                                borderRadius: 10, border: '1.5px solid', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                                borderColor: selectedTable === t.key ? 'var(--color-primary)' : 'var(--color-border)',
                                background: selectedTable === t.key ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                                color: selectedTable === t.key ? 'var(--color-primary)' : 'var(--color-text)',
                                transition: 'all 0.15s',
                            }}>
                            {TABLE_ICONS[t.key] || <Database size={16} />}
                            {t.name}
                            <span style={{ fontSize: 11, opacity: 0.5 }}>({t.totalColumns} cols)</span>
                        </button>
                    ))}
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>
                    {lbl('Optional — auto-detected from file headers if not selected', 'वैकल्पिक — फाइल हेडर से ऑटो पता लगेगा')}
                </p>
            </div>

            {/* Dropzone */}
            <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                    border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 16, padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
                    background: dragging ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                    transition: 'all 0.2s',
                }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <div style={{ width: 20, height: 20, border: '2px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                        <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>{lbl('Analyzing...', 'विश्लेषण हो रहा है...')}</span>
                    </div>
                ) : (
                    <>
                        <Upload size={40} style={{ color: 'var(--color-primary)', opacity: 0.6, marginBottom: 12 }} />
                        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
                            {lbl('Drop Excel file here or click to browse', 'एक्सेल फाइल यहाँ छोड़ें या ब्राउज़ करें')}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>.xlsx, .xls, .csv</p>
                    </>
                )}
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
            </div>
        </div>
    );

    // ─── STEP: Map Columns ───
    const renderMap = () => {
        const mapped = mappings.filter(m => m.target);
        const unmapped = mappings.filter(m => !m.target);

        return (
            <div>
                {/* Summary bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                            {lbl(`${mapped.length} mapped`, `${mapped.length} मैप हुए`)} ·
                            <span style={{ color: 'var(--color-text-muted)' }}> {unmapped.length} {lbl('skipped', 'छोड़े गए')}</span>
                        </span>
                        <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, background: 'var(--color-primary-soft)', color: 'var(--color-primary)', fontWeight: 600 }}>
                            → {selectedTable}
                        </span>
                    </div>

                    {/* Import mode */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <label style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>{lbl('Mode:', 'मोड:')}</label>
                        <select value={importMode} onChange={e => setImportMode(e.target.value)}
                            style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}>
                            <option value="insert">{lbl('Insert Only', 'केवल नया')}</option>
                            <option value="upsert">{lbl('Insert + Update', 'नया + अपडेट')}</option>
                            <option value="insert_all">{lbl('Insert All (no dedup)', 'सब नया (कोई dedup नहीं)')}</option>
                        </select>
                    </div>
                </div>

                {/* Mapping table */}
                <div style={{ borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: 'var(--color-surface)' }}>
                                <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid var(--color-primary)', color: 'var(--color-text)', fontWeight: 600 }}>
                                    {lbl('Source Column', 'सोर्स कॉलम')}
                                </th>
                                <th style={{ textAlign: 'center', padding: '10px 8px', borderBottom: '2px solid var(--color-primary)', width: 30 }}>→</th>
                                <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid var(--color-primary)', color: 'var(--color-text)', fontWeight: 600 }}>
                                    {lbl('Target Column', 'टारगेट कॉलम')}
                                </th>
                                <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '2px solid var(--color-primary)', color: 'var(--color-text)', fontWeight: 600, width: 100 }}>
                                    {lbl('Match', 'मैच')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {mappings.map((m, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)', background: m.target ? 'var(--color-bg)' : 'transparent', opacity: m.target ? 1 : 0.5 }}>
                                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text)' }}>
                                        <FileSpreadsheet size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6, opacity: 0.4 }} />
                                        {m.source}
                                    </td>
                                    <td style={{ textAlign: 'center', color: m.target ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                                        {m.target ? <ArrowRight size={14} /> : <X size={14} />}
                                    </td>
                                    <td style={{ padding: '6px 8px' }}>
                                        <select value={m.target || ''} onChange={e => handleMappingChange(i, e.target.value || null)}
                                            style={{
                                                width: '100%', padding: '5px 8px', fontSize: 12, borderRadius: 6,
                                                border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)',
                                            }}>
                                            <option value="">{lbl('— Skip —', '— छोड़ें —')}</option>
                                            {(uploadResult?.targetColumns || []).map((col: string) => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '8px 12px' }}>
                                        {getMethodBadge(m.method, m.confidence)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                    <button onClick={() => { setStep('upload'); setUploadResult(null); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 13, cursor: 'pointer' }}>
                        <ArrowLeft size={14} /> {lbl('Back', 'वापस')}
                    </button>
                    <button onClick={handleAnalyze} disabled={loading || mapped.length === 0}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 24px', borderRadius: 10, border: 'none',
                            background: mapped.length > 0 ? 'var(--color-primary)' : 'var(--color-border)',
                            color: 'white', fontSize: 13, fontWeight: 600, cursor: mapped.length > 0 ? 'pointer' : 'not-allowed',
                        }}>
                        <Zap size={14} /> {loading ? lbl('Analyzing...', 'विश्लेषण...') : lbl('Analyze', 'विश्लेषण')}
                    </button>
                </div>
            </div>
        );
    };

    // ─── STEP: Review ───
    const renderReview = () => (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                    { label: lbl('Will Insert', 'नया होगा'), value: analysis?.wouldInsert || 0, color: '#059669', icon: <CheckCircle2 size={18} /> },
                    { label: lbl('Will Update', 'अपडेट होगा'), value: analysis?.wouldUpdate || 0, color: '#d97706', icon: <Zap size={18} /> },
                    { label: lbl('Will Skip', 'छोड़ा जायेगा'), value: analysis?.wouldSkip || 0, color: '#94a3b8', icon: <X size={18} /> },
                ].map((stat, i) => (
                    <div key={i} style={{ borderRadius: 12, border: '1px solid var(--color-border)', padding: 16, textAlign: 'center', background: 'var(--color-surface)' }}>
                        <div style={{ color: stat.color, marginBottom: 4 }}>{stat.icon}</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ padding: 16, borderRadius: 12, background: 'var(--color-primary-soft)', border: '1px solid var(--color-border)', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 4 }}>
                    {lbl('Import Summary', 'आयात सारांश')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text)' }}>
                    <strong>{analysis?.totalRows}</strong> {lbl('total rows', 'कुल पंक्तियाँ')} → <strong>{selectedTable}</strong>
                    <br />
                    {lbl('Mode:', 'मोड:')} <strong>{importMode === 'upsert' ? lbl('Insert + Update', 'नया + अपडेट') : importMode === 'insert_all' ? lbl('Insert All', 'सब नया') : lbl('Insert Only', 'केवल नया')}</strong>
                </div>
            </div>

            {analysis?.detailLog && analysis.detailLog.length > 0 && (
                <div style={{ marginBottom: 20, maxHeight: 200, overflow: 'auto', borderRadius: 10, border: '1px solid var(--color-border)', padding: 12, background: 'var(--color-surface)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
                        {lbl('Detail Log', 'विस्तृत लॉग')}
                    </div>
                    {analysis.detailLog.map((line, i) => (
                        <div key={i} style={{ fontSize: 11, color: 'var(--color-text-muted)', padding: '2px 0', fontFamily: 'monospace' }}>
                            <AlertTriangle size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4, color: '#d97706' }} />
                            {line}
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setStep('map')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 13, cursor: 'pointer' }}>
                    <ArrowLeft size={14} /> {lbl('Back', 'वापस')}
                </button>
                <button onClick={handleExecuteImport} disabled={loading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '10px 28px', borderRadius: 10, border: 'none',
                        background: 'var(--color-primary)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}>
                    <Check size={16} /> {loading ? lbl('Importing...', 'आयात हो रहा है...') : lbl('Execute Import', 'आयात करें')}
                </button>
            </div>
        </div>
    );

    // ─── STEP: Done ───
    const renderDone = () => (
        <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#05966915', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle2 size={32} style={{ color: '#059669' }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
                {lbl('Import Complete!', 'आयात पूरा!')}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 20, marginBottom: 20, textAlign: 'center' }}>
                {[
                    { label: lbl('Inserted', 'नया'), value: importResult?.inserted || 0, color: '#059669' },
                    { label: lbl('Updated', 'अपडेट'), value: importResult?.updated || 0, color: '#d97706' },
                    { label: lbl('Skipped', 'छोड़ा'), value: importResult?.skipped || 0, color: '#94a3b8' },
                    { label: lbl('Failed', 'असफल'), value: importResult?.failed || 0, color: '#dc2626' },
                ].map((s, i) => (
                    <div key={i} style={{ padding: 12, borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {importResult?.errors?.length > 0 && (
                <div style={{ textAlign: 'left', marginBottom: 20, maxHeight: 160, overflow: 'auto', borderRadius: 10, border: '1px solid #fecaca', padding: 12, background: '#fef2f2' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', marginBottom: 6 }}>
                        <AlertCircle size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                        {importResult.errors.length} {lbl('errors', 'त्रुटियाँ')}
                    </div>
                    {importResult.errors.slice(0, 20).map((e: string, i: number) => (
                        <div key={i} style={{ fontSize: 11, color: '#b91c1c', fontFamily: 'monospace', padding: '1px 0' }}>{e}</div>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button onClick={() => { setStep('upload'); setUploadResult(null); setImportResult(null); setAnalysis(null); setMappings([]); }}
                    style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 13, cursor: 'pointer' }}>
                    {lbl('Import Another', 'और आयात करें')}
                </button>
                <button onClick={() => navigate('/import-history')}
                    style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 13, cursor: 'pointer' }}>
                    {lbl('View History', 'इतिहास देखें')}
                </button>
            </div>
        </div>
    );

    // ─── Steps indicator ───
    const steps: { key: Step; label: string }[] = [
        { key: 'upload', label: lbl('Upload', 'अपलोड') },
        { key: 'map', label: lbl('Map', 'मैप') },
        { key: 'review', label: lbl('Review', 'समीक्षा') },
        { key: 'done', label: lbl('Done', 'पूरा') },
    ];
    const stepIdx = steps.findIndex(s => s.key === step);

    return (
        <div style={{ height: '100%', overflow: 'auto', padding: 24, background: 'var(--color-bg)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ padding: 10, borderRadius: 12, background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
                    <Upload size={22} />
                </div>
                <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                        {lbl('Smart Import', 'स्मार्ट आयात')}
                    </h2>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                        {lbl('Import Excel data with auto column matching', 'ऑटो कॉलम मैचिंग के साथ एक्सेल डेटा आयात करें')}
                    </p>
                </div>
            </div>

            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 32 }}>
                {steps.map((s, i) => (
                    <React.Fragment key={s.key}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20,
                            background: i <= stepIdx ? 'var(--color-primary)' : 'var(--color-surface)',
                            color: i <= stepIdx ? 'white' : 'var(--color-text-muted)',
                            fontSize: 12, fontWeight: i === stepIdx ? 700 : 500,
                            border: `1px solid ${i <= stepIdx ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        }}>
                            <span style={{ width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, background: i <= stepIdx ? 'rgba(255,255,255,0.25)' : 'var(--color-bg)' }}>
                                {i < stepIdx ? <Check size={10} /> : i + 1}
                            </span>
                            {s.label}
                        </div>
                        {i < steps.length - 1 && (
                            <div style={{ width: 24, height: 2, background: i < stepIdx ? 'var(--color-primary)' : 'var(--color-border)', borderRadius: 1 }} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Step content */}
            {step === 'upload' && renderUpload()}
            {step === 'map' && renderMap()}
            {step === 'review' && renderReview()}
            {step === 'done' && renderDone()}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
