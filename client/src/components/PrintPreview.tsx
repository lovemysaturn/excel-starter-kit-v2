import React, { useState, useRef } from 'react';
import { Printer, X, Download, Edit3, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PrintPreviewProps {
    title: string;
    columns: { key: string; label: string }[];
    rows: Record<string, any>[];
    onClose: () => void;
}

export default function PrintPreview({ title: initialTitle, columns, rows, onClose }: PrintPreviewProps) {
    const [title, setTitle] = useState(initialTitle);
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(initialTitle);
    const printRef = useRef<HTMLDivElement>(null);

    const now = new Date().toLocaleString();

    const handleSaveTitle = () => {
        setTitle(editValue);
        setEditing(false);
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`
            <!DOCTYPE html>
            <html><head>
                <title>${title}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #1a1a1a; }
                    .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 12px; }
                    .print-header h1 { font-size: 18px; margin-bottom: 4px; }
                    .print-header p { font-size: 11px; color: #666; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    th { background: #f0f0f0; border: 1px solid #ccc; padding: 6px 8px; font-weight: 600; text-align: left; }
                    td { border: 1px solid #ddd; padding: 5px 8px; }
                    tr:nth-child(even) { background: #fafafa; }
                    .print-footer { margin-top: 16px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 8px; }
                    @media print { body { padding: 12px; } }
                </style>
            </head><body>
                <div class="print-header">
                    <h1>${title}</h1>
                    <p>${now} · ${rows.length} records</p>
                </div>
                <table>
                    <thead><tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
                    <tbody>${rows.map(row =>
            `<tr>${columns.map(c => `<td>${row[c.key] ?? ''}</td>`).join('')}</tr>`
        ).join('')}</tbody>
                </table>
                <div class="print-footer">Printed from Excel Starter Kit v2</div>
            </body></html>
        `);
        win.document.close();
        setTimeout(() => { win.print(); }, 300);
    };

    const handleDownloadPdf = () => {
        const doc = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait' });
        doc.setFontSize(16);
        doc.text(title, 14, 18);
        doc.setFontSize(9);
        doc.setTextColor(128);
        doc.text(`${now} · ${rows.length} records`, 14, 24);

        autoTable(doc, {
            startY: 30,
            head: [columns.map(c => c.label)],
            body: rows.map(row => columns.map(c => String(row[c.key] ?? ''))),
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [60, 60, 60], fontSize: 8, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 248, 248] },
            margin: { top: 30 },
        });

        doc.save(`${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px',
                background: 'var(--color-card)', borderBottom: '1px solid var(--color-border)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Printer size={18} style={{ color: 'var(--color-primary)' }} />
                    {editing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input value={editValue} onChange={e => setEditValue(e.target.value)}
                                autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setEditing(false); }}
                                style={{
                                    fontSize: 16, fontWeight: 700, border: '1px solid var(--color-primary)',
                                    borderRadius: 6, padding: '4px 8px', background: 'var(--color-surface)', color: 'var(--color-text)',
                                    width: 320,
                                }} />
                            <button onClick={handleSaveTitle} style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>
                                <Check size={14} />
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => { setEditing(true); setEditValue(title); }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{title}</h2>
                            <Edit3 size={13} style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {rows.length} records · {now}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={handleDownloadPdf}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10,
                            border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)',
                            fontSize: 13, cursor: 'pointer',
                        }}>
                        <Download size={14} /> PDF
                    </button>
                    <button onClick={handlePrint}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10,
                            border: 'none', background: 'var(--color-primary)', color: 'white',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}>
                        <Printer size={14} /> Print
                    </button>
                    <button onClick={onClose}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4, marginLeft: 4 }}>
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Content — infinite scroll, no pagination */}
            <div ref={printRef} style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    {/* Title block */}
                    <div style={{ textAlign: 'center', marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid var(--color-text)' }}>
                        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>{title}</h1>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{now} · {rows.length} records</p>
                    </div>

                    {/* Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '2px solid var(--color-text)', background: 'var(--color-surface)', color: 'var(--color-text)', fontWeight: 700, fontSize: 11, width: 40 }}>#</th>
                                {columns.map(col => (
                                    <th key={col.key} style={{
                                        textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--color-text)',
                                        background: 'var(--color-surface)', color: 'var(--color-text)', fontWeight: 700, fontSize: 11,
                                    }}>
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'var(--color-surface)' }}>
                                    <td style={{ textAlign: 'center', padding: '6px', color: 'var(--color-text-muted)', fontSize: 11 }}>{i + 1}</td>
                                    {columns.map(col => (
                                        <td key={col.key} style={{ padding: '6px 10px', color: 'var(--color-text)', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {row[col.key] ?? ''}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ marginTop: 16, fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
                        Printed from Excel Starter Kit v2 · {rows.length} total records
                    </div>
                </div>
            </div>
        </div>
    );
}
