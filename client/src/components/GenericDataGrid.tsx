import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import AutocompleteInput from './AutocompleteInput';
import { useAppStore } from '@/store/appStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { exportToExcel, exportToPdf } from '@/hooks/useExport';
import PrintPreview from './PrintPreview';
import {
    ArrowUp, ArrowDown, Search, X, Replace, Download, FileSpreadsheet, FileText,
    Trash2, ChevronDown, ChevronUp, Printer, Pin, PinOff,
} from 'lucide-react';

export interface ColumnDef {
    key: string;
    label: string;
    labelHi?: string;
    type: 'text' | 'number' | 'currency' | 'date';
    options?: string[];
    width?: number;
}

interface Props {
    data: any[];
    columns: ColumnDef[];
    onCellSave: (rowId: number, colKey: string, value: any) => void;
    onRowDelete?: (ids: number[]) => void;
    onRowAdd?: () => void;
    loading?: boolean;
    tableName?: string;
}

const ROW_HEIGHT = 32;

// Conditional formatting: returns inline style based on value + type
function getCellStyle(value: any, type: string): React.CSSProperties | undefined {
    if (value === null || value === undefined || value === '') {
        return { color: 'var(--color-muted-foreground)', fontStyle: 'italic' };
    }
    if (type === 'currency' || type === 'number') {
        const n = Number(value);
        if (isNaN(n)) return undefined;
        if (n < 0) return { color: '#dc2626', fontWeight: 600 };
        if (n === 0) return { color: 'var(--color-muted-foreground)' };
        if (type === 'currency' && n >= 100000) return { color: '#059669', fontWeight: 600 };
        if (type === 'currency' && n >= 10000) return { color: '#0d9488' };
    }
    const lower = String(value).toLowerCase();
    if (lower === 'pending' || lower === 'unpaid') return { color: '#d97706', fontWeight: 500 };
    if (lower === 'paid' || lower === 'completed' || lower === 'done' || lower === 'approved') return { color: '#059669', fontWeight: 500 };
    if (lower === 'cancelled' || lower === 'rejected' || lower === 'failed') return { color: '#dc2626', fontWeight: 500 };
    if (lower === 'draft' || lower === 'inactive') return { color: 'var(--color-muted-foreground)', fontStyle: 'italic' };
    return undefined;
}

export default function GenericDataGrid({ data, columns, onCellSave, onRowDelete, onRowAdd, loading, tableName = 'data' }: Props) {
    const language = useAppStore(s => s.language);
    const updateStatusBar = useAppStore(s => s.updateStatusBar);
    const label = (en: string, hi: string) => language === 'hi' ? hi : en;

    // ─── Cell Navigation ───
    const [focusRow, setFocusRow] = useState(0);
    const [focusCol, setFocusCol] = useState(0);
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    // ─── Selection ───
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

    // ─── Sorting ───
    const [sortCol, setSortCol] = useState<string>('');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    // ─── Find & Replace ───
    const [showFind, setShowFind] = useState(false);
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [findMatches, setFindMatches] = useState<{ row: number; col: number }[]>([]);
    const [findIdx, setFindIdx] = useState(0);

    // ─── Undo ───
    const [undoStack, setUndoStack] = useState<{ rowId: number; col: string; oldVal: any }[]>([]);
    const [showPrint, setShowPrint] = useState(false);

    // ─── Frozen columns ───
    const [frozenCount, setFrozenCount] = useState(0);

    // ─── Column widths ───
    const [colWidths, setColWidths] = useState<Record<string, number>>({});

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Sorted data
    const sortedData = useMemo(() => {
        if (!sortCol) return data;
        return [...data].sort((a, b) => {
            const va = a[sortCol] ?? '';
            const vb = b[sortCol] ?? '';
            if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
            return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
        });
    }, [data, sortCol, sortDir]);

    // ─── Virtual Scrolling ───
    const rowVirtualizer = useVirtualizer({
        count: sortedData.length,
        getScrollElement: () => scrollContainerRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 10,
    });

    // Frozen column left offsets
    const frozenLeftOffsets = useMemo(() => {
        const offsets: number[] = [];
        let left = 40; // # column width
        for (let i = 0; i < frozenCount && i < columns.length; i++) {
            offsets.push(left);
            left += colWidths[columns[i].key] || columns[i].width || 120;
        }
        return offsets;
    }, [frozenCount, columns, colWidths]);

    // Update status bar
    useEffect(() => {
        const amounts = data.map(r => Number(r.amount || r.total || 0)).filter(n => !isNaN(n));
        updateStatusBar({
            totalRecords: data.length,
            selectedCount: selectedRows.size,
            sumAmount: amounts.reduce((s, n) => s + n, 0),
        });
    }, [data.length, selectedRows.size]);

    // Find logic
    useEffect(() => {
        if (!findText) { setFindMatches([]); return; }
        const matches: { row: number; col: number }[] = [];
        sortedData.forEach((row, ri) => {
            columns.forEach((col, ci) => {
                if (String(row[col.key] ?? '').toLowerCase().includes(findText.toLowerCase())) {
                    matches.push({ row: ri, col: ci });
                }
            });
        });
        setFindMatches(matches);
        setFindIdx(0);
    }, [findText, sortedData, columns]);

    // ─── Keyboard Handler ───
    const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
        if (editing) return;

        // Ctrl shortcuts
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'f') { e.preventDefault(); setShowFind(true); return; }
            if (e.key === 'z') { e.preventDefault(); handleUndo(); return; }
            if (e.key === 'a') { e.preventDefault(); setSelectedRows(new Set(sortedData.map(r => r.id))); return; }
            // Ctrl+C = Copy
            if (e.key === 'c') {
                const col = columns[focusCol];
                const row = sortedData[focusRow];
                if (col && row) {
                    navigator.clipboard.writeText(String(row[col.key] ?? ''));
                    toast.success('Copied', { duration: 1000 });
                }
                return;
            }
            // Ctrl+V = Paste
            if (e.key === 'v') {
                e.preventDefault();
                const col = columns[focusCol];
                const row = sortedData[focusRow];
                if (col && row) {
                    const text = await navigator.clipboard.readText();
                    const newValue = col.type === 'number' || col.type === 'currency' ? Number(text) || 0 : text;
                    setUndoStack(prev => [...prev, { rowId: row.id, col: col.key, oldVal: row[col.key] }]);
                    onCellSave(row.id, col.key, newValue);
                    toast.success('Pasted', { duration: 1000 });
                }
                return;
            }
            // Ctrl+D = Fill down
            if (e.key === 'd') {
                e.preventDefault();
                if (focusRow > 0) {
                    const col = columns[focusCol];
                    const aboveRow = sortedData[focusRow - 1];
                    const currentRow = sortedData[focusRow];
                    if (col && aboveRow && currentRow) {
                        const aboveVal = aboveRow[col.key];
                        setUndoStack(prev => [...prev, { rowId: currentRow.id, col: col.key, oldVal: currentRow[col.key] }]);
                        onCellSave(currentRow.id, col.key, aboveVal);
                        toast.success('Filled from above', { duration: 1000 });
                    }
                }
                return;
            }
            return;
        }

        if (e.key === 'F1') { e.preventDefault(); window.location.hash = '#/shortcuts'; return; }

        const maxRow = sortedData.length - 1;
        const maxCol = columns.length - 1;

        switch (e.key) {
            case 'ArrowDown': e.preventDefault(); setFocusRow(r => Math.min(r + 1, maxRow)); break;
            case 'ArrowUp': e.preventDefault(); setFocusRow(r => Math.max(r - 1, 0)); break;
            case 'ArrowRight': e.preventDefault(); setFocusCol(c => Math.min(c + 1, maxCol)); break;
            case 'ArrowLeft': e.preventDefault(); setFocusCol(c => Math.max(c - 1, 0)); break;
            case 'Tab':
                e.preventDefault();
                if (e.shiftKey) { if (focusCol > 0) setFocusCol(c => c - 1); else if (focusRow > 0) { setFocusRow(r => r - 1); setFocusCol(maxCol); } }
                else { if (focusCol < maxCol) setFocusCol(c => c + 1); else if (focusRow < maxRow) { setFocusRow(r => r + 1); setFocusCol(0); } }
                break;
            case 'Enter': case 'F2': e.preventDefault(); startEditing(); break;
            case ' ':
                e.preventDefault();
                const rowId = sortedData[focusRow]?.id;
                if (rowId != null) setSelectedRows(prev => {
                    const next = new Set(prev);
                    next.has(rowId) ? next.delete(rowId) : next.add(rowId);
                    return next;
                });
                break;
            case 'Delete':
                if (selectedRows.size > 0 && onRowDelete) {
                    e.preventDefault(); onRowDelete(Array.from(selectedRows)); setSelectedRows(new Set());
                }
                break;
            case 'Home': e.preventDefault(); setFocusCol(0); if (e.ctrlKey) setFocusRow(0); break;
            case 'End': e.preventDefault(); setFocusCol(maxCol); if (e.ctrlKey) setFocusRow(maxRow); break;
            case 'PageDown': e.preventDefault(); setFocusRow(r => Math.min(r + 10, maxRow)); break;
            case 'PageUp': e.preventDefault(); setFocusRow(r => Math.max(r - 10, 0)); break;
            default:
                if (e.key.length === 1 && !e.ctrlKey && !e.altKey) { e.preventDefault(); setEditValue(e.key); setEditing(true); }
        }
    }, [editing, focusRow, focusCol, sortedData, columns, selectedRows, onRowDelete]);

    const startEditing = () => {
        if (sortedData[focusRow]) {
            const val = sortedData[focusRow][columns[focusCol].key];
            setEditValue(val != null ? String(val) : '');
            setEditing(true);
        }
    };

    const confirmEdit = () => {
        const row = sortedData[focusRow];
        const col = columns[focusCol];
        if (!row || !col) { setEditing(false); return; }
        const oldValue = row[col.key];
        const newValue = col.type === 'number' || col.type === 'currency' ? Number(editValue) || 0 : editValue;
        if (String(oldValue) !== String(newValue)) {
            setUndoStack(prev => [...prev, { rowId: row.id, col: col.key, oldVal: oldValue }]);
            onCellSave(row.id, col.key, newValue);
            updateStatusBar({ lastSaved: new Date().toLocaleTimeString() });
            toast.success(`${col.label} updated`, { duration: 1500 });
        }
        setEditing(false);
    };

    const handleUndo = () => {
        const last = undoStack[undoStack.length - 1];
        if (!last) return;
        onCellSave(last.rowId, last.col, last.oldVal);
        setUndoStack(prev => prev.slice(0, -1));
        toast.info('Undo', { duration: 1500 });
    };

    const handleSort = (key: string) => {
        if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortCol(key); setSortDir('asc'); }
    };

    const handleExportExcel = () => exportToExcel(sortedData, columns.map(c => ({ key: c.key, label: c.label })), tableName);
    const handleExportPdf = () => exportToPdf(sortedData, columns.map(c => ({ key: c.key, label: c.label })), tableName, tableName.toUpperCase());

    // Column auto-fit: double-click resize handle
    const autoFitColumn = (colKey: string) => {
        const colIdx = columns.findIndex(c => c.key === colKey);
        if (colIdx < 0) return;
        let maxWidth = 60;
        const headerEl = scrollContainerRef.current?.querySelector(`thead th:nth-child(${colIdx + 2})`) as HTMLElement;
        if (headerEl) maxWidth = Math.max(maxWidth, headerEl.scrollWidth + 16);
        const rows = scrollContainerRef.current?.querySelectorAll(`tbody tr`);
        rows?.forEach(tr => {
            const td = tr.children[colIdx + 1] as HTMLElement;
            if (td) {
                const span = td.querySelector('span');
                if (span) maxWidth = Math.max(maxWidth, span.scrollWidth + 20);
            }
        });
        setColWidths(prev => ({ ...prev, [colKey]: Math.min(maxWidth, 400) }));
    };

    // Column resize via drag
    const startResize = (e: React.MouseEvent, colKey: string) => {
        e.preventDefault(); e.stopPropagation();
        const th = (e.currentTarget as HTMLElement).parentElement!;
        const startX = e.clientX;
        const startWidth = th.offsetWidth;
        const onMouseMove = (ev: MouseEvent) => {
            const newW = Math.max(60, startWidth + ev.clientX - startX);
            setColWidths(prev => ({ ...prev, [colKey]: newW }));
        };
        const onMouseUp = () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    // Scroll focused row into view (virtual)
    useEffect(() => {
        rowVirtualizer.scrollToIndex(focusRow, { align: 'auto' });
    }, [focusRow]);

    if (loading) return <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse">Loading...</div>;

    return (
        <div className="flex flex-col flex-1 min-h-0" onKeyDown={handleKeyDown} tabIndex={0}>
            {/* Export + actions toolbar */}
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-muted/30">
                <Button variant="ghost" size="sm" onClick={handleExportExcel} title="Export to Excel">
                    <FileSpreadsheet size={14} /> <span className="hidden sm:inline text-xs">Excel</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleExportPdf} title="Export to PDF">
                    <FileText size={14} /> <span className="hidden sm:inline text-xs">PDF</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowPrint(true)} title="Print Preview">
                    <Printer size={14} /> <span className="hidden sm:inline text-xs">{label('Print', 'प्रिंट')}</span>
                </Button>
                <div className="toolbar-separator" />
                <Button
                    variant={frozenCount > 0 ? "secondary" : "ghost"} size="sm"
                    onClick={() => setFrozenCount(c => c >= 3 ? 0 : c + 1)}
                    title={frozenCount > 0 ? `${frozenCount} frozen — click to cycle` : 'Freeze columns'}
                >
                    {frozenCount > 0 ? <Pin size={14} /> : <PinOff size={14} />}
                    <span className="hidden sm:inline text-xs">
                        {frozenCount > 0 ? `Freeze ${frozenCount}` : 'Freeze'}
                    </span>
                </Button>
                <div className="toolbar-separator" />
                {selectedRows.size > 0 && (
                    <>
                        <Badge variant="secondary">{selectedRows.size} selected</Badge>
                        <Button variant="destructive" size="sm" onClick={() => { onRowDelete?.(Array.from(selectedRows)); setSelectedRows(new Set()); }}>
                            <Trash2 size={14} /> Delete
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedRows(new Set())}>Clear</Button>
                    </>
                )}
            </div>

            {/* Find & Replace */}
            {showFind && (
                <div className="find-bar animate-slide-down">
                    <Search size={14} className="text-muted-foreground" />
                    <Input className="h-7 w-48 text-xs" placeholder={label('Find...', 'खोजें...')} value={findText} onChange={e => setFindText(e.target.value)} autoFocus />
                    <Replace size={14} className="text-muted-foreground ml-2" />
                    <Input className="h-7 w-48 text-xs" placeholder={label('Replace...', 'बदलें...')} value={replaceText} onChange={e => setReplaceText(e.target.value)} />
                    <Badge variant="outline">{findMatches.length} {label('matches', 'मिले')}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setShowFind(false); setFindText(''); setReplaceText(''); }}>
                        <X size={14} />
                    </Button>
                </div>
            )}

            {/* Virtualized Table */}
            <div ref={scrollContainerRef} className="flex-1 overflow-auto" style={{ contain: 'strict' }}>
                <table className="data-table" style={{ width: '100%' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                        <tr>
                            <th style={{ width: 40, textAlign: 'center' }}>#</th>
                            {columns.map((col, ci) => {
                                const isFrozen = ci < frozenCount;
                                return (
                                    <th
                                        key={col.key}
                                        onClick={() => handleSort(col.key)}
                                        style={{
                                            width: colWidths[col.key] || col.width,
                                            minWidth: colWidths[col.key] || col.width || 80,
                                            ...(isFrozen ? {
                                                position: 'sticky' as const,
                                                left: frozenLeftOffsets[ci] ?? 0,
                                                zIndex: 3,
                                                borderRight: ci === frozenCount - 1 ? '3px solid var(--color-primary, #e11d48)' : undefined,
                                            } : {}),
                                        }}
                                    >
                                        <div className="flex items-center gap-1" style={{ position: 'relative' }}>
                                            {language === 'hi' && col.labelHi ? col.labelHi : col.label}
                                            {sortCol === col.key && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                        </div>
                                        <div
                                            className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize"
                                            style={{ position: 'absolute', right: 0, top: 0 }}
                                            onMouseDown={e => startResize(e, col.key)}
                                            onDoubleClick={() => autoFitColumn(col.key)}
                                        />
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Virtual spacer — pushes rows to correct position */}
                        {rowVirtualizer.getVirtualItems().length > 0 && (
                            <tr style={{ height: rowVirtualizer.getVirtualItems()[0]?.start || 0 }}>
                                <td colSpan={columns.length + 1} style={{ padding: 0, border: 'none' }} />
                            </tr>
                        )}

                        {rowVirtualizer.getVirtualItems().map(virtualRow => {
                            const ri = virtualRow.index;
                            const row = sortedData[ri];
                            if (!row) return null;

                            return (
                                <tr
                                    key={row.id}
                                    data-index={ri}
                                    className={selectedRows.has(row.id) ? 'row-selected' : ''}
                                    style={{ height: ROW_HEIGHT }}
                                >
                                    <td style={{ textAlign: 'center', color: 'var(--color-muted-foreground)', fontSize: 11 }}>{ri + 1}</td>
                                    {columns.map((col, ci) => {
                                        const isFocused = ri === focusRow && ci === focusCol;
                                        const isEditing = isFocused && editing;
                                        const isMatch = findText && String(row[col.key] ?? '').toLowerCase().includes(findText.toLowerCase());
                                        const isFrozen = ci < frozenCount;

                                        return (
                                            <td
                                                key={col.key}
                                                className={`${isFocused ? 'cell-focused' : ''} ${isEditing ? 'cell-editing' : ''}`}
                                                onClick={() => { setFocusRow(ri); setFocusCol(ci); }}
                                                onDoubleClick={() => { setFocusRow(ri); setFocusCol(ci); startEditing(); }}
                                                style={{
                                                    ...(isMatch ? { background: 'color-mix(in srgb, var(--color-warning) 20%, transparent)' } : {}),
                                                    ...(isFrozen ? {
                                                        position: 'sticky' as const,
                                                        left: frozenLeftOffsets[ci] ?? 0,
                                                        zIndex: 1,
                                                        background: 'var(--color-bg, #fff)',
                                                        borderRight: ci === frozenCount - 1 ? '3px solid var(--color-primary, #e11d48)' : undefined,
                                                    } : {}),
                                                }}
                                            >
                                                {isEditing ? (
                                                    <AutocompleteInput
                                                        value={editValue}
                                                        options={col.options || []}
                                                        type={col.type}
                                                        onChange={setEditValue}
                                                        onConfirm={confirmEdit}
                                                        onCancel={() => setEditing(false)}
                                                        onTab={(shift) => {
                                                            if (shift) { if (focusCol > 0) setFocusCol(c => c - 1); }
                                                            else { if (focusCol < columns.length - 1) setFocusCol(c => c + 1); }
                                                        }}
                                                    />
                                                ) : (
                                                    <span style={getCellStyle(row[col.key], col.type)}>
                                                        {col.type === 'currency' ? `₹${Number(row[col.key] || 0).toLocaleString('en-IN')}` :
                                                            String(row[col.key] ?? '')}
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}

                        {/* Bottom spacer */}
                        {rowVirtualizer.getVirtualItems().length > 0 && (
                            <tr style={{ height: rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end || 0) }}>
                                <td colSpan={columns.length + 1} style={{ padding: 0, border: 'none' }} />
                            </tr>
                        )}
                    </tbody>
                </table>
                {sortedData.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <p>{label('No data', 'कोई डेटा नहीं')}</p>
                    </div>
                )}
            </div>
            {showPrint && (
                <PrintPreview
                    title={tableName.charAt(0).toUpperCase() + tableName.slice(1)}
                    columns={columns.map(c => ({ key: c.key, label: c.label }))}
                    rows={sortedData}
                    onClose={() => setShowPrint(false)}
                />
            )}
        </div>
    );
}
