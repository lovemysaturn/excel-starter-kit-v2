import React, { useState, useEffect, useCallback } from 'react';
import GenericDataGrid, { ColumnDef } from '@/components/GenericDataGrid';
import { Button } from '@/components/ui/button';
import { useLabel } from '@/store/appStore';
import { apiGet, apiPut, apiPost } from '@/hooks/useApi';
import { toast } from 'sonner';
import { Plus, RefreshCw, Receipt } from 'lucide-react';

const COLUMNS: ColumnDef[] = [
    { key: 'ref_no', label: 'Ref No', labelHi: 'संदर्भ सं.', type: 'text' },
    { key: 'type', label: 'Type', labelHi: 'प्रकार', type: 'text' },
    { key: 'party_name', label: 'Party', labelHi: 'पार्टी', type: 'text' },
    { key: 'description', label: 'Description', labelHi: 'विवरण', type: 'text' },
    { key: 'amount', label: 'Amount', labelHi: 'राशि', type: 'currency' },
    { key: 'tax', label: 'Tax', labelHi: 'कर', type: 'currency' },
    { key: 'total', label: 'Total', labelHi: 'कुल', type: 'currency' },
    { key: 'payment_mode', label: 'Mode', labelHi: 'माध्यम', type: 'text' },
    { key: 'payment_status', label: 'Status', labelHi: 'स्थिति', type: 'text' },
    { key: 'date', label: 'Date', labelHi: 'तारीख', type: 'date' },
    { key: 'due_date', label: 'Due Date', labelHi: 'देय तिथि', type: 'date' },
    { key: 'notes', label: 'Notes', labelHi: 'टिप्पणी', type: 'text' },
];

export default function TransactionsTable() {
    const label = useLabel();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [masterOptions, setMasterOptions] = useState<Record<string, string[]>>({});

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [items, opts] = await Promise.all([apiGet('/transactions'), apiGet('/transactions/masters/options')]);
            setData(items.data); setMasterOptions(opts);
        } catch { toast.error('Failed to load'); }
        setLoading(false);
    }, []);
    useEffect(() => { fetchData(); }, []);

    const columnsWithOptions: ColumnDef[] = COLUMNS.map(col => ({ ...col, options: masterOptions[col.key] || [] }));
    const handleCellSave = useCallback(async (rowId: number, colKey: string, value: any) => {
        await apiPut(`/transactions/${rowId}/cell`, { column: colKey, value });
        setData(prev => prev.map(r => r.id === rowId ? { ...r, [colKey]: value } : r));
    }, []);
    const handleAdd = useCallback(async () => { await apiPost('/transactions', { ref_no: `TXN-${String(data.length + 1).padStart(3, '0')}` }); toast.success(label('Added', 'जोड़ा')); fetchData(); }, [fetchData, data.length, label]);
    const handleDelete = useCallback(async (ids: number[]) => { await apiPost('/transactions/bulk-delete', { ids }); setData(prev => prev.filter(r => !ids.includes(r.id))); toast.success(`${ids.length} deleted`); }, []);

    return (
        <div className="h-full flex flex-col">
            <div className="toolbar">
                <Receipt size={16} className="text-emerald-500" />
                <span className="font-semibold text-sm">{label('Transactions', 'लेनदेन')}</span>
                <div className="toolbar-separator" />
                <Button variant="default" size="sm" onClick={handleAdd}><Plus size={14} /> {label('Add', 'जोड़ें')}</Button>
                <Button variant="ghost" size="sm" onClick={fetchData}><RefreshCw size={14} /></Button>
                <div className="flex-1" />
                <span className="text-xs text-muted-foreground">{data.length} {label('records', 'रिकॉर्ड')}</span>
            </div>
            <GenericDataGrid data={data} columns={columnsWithOptions} onCellSave={handleCellSave} onRowDelete={handleDelete} onRowAdd={handleAdd} loading={loading} tableName="transactions" />
        </div>
    );
}
