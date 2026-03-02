import React, { useState, useEffect, useCallback } from 'react';
import GenericDataGrid, { ColumnDef } from '@/components/GenericDataGrid';
import { Button } from '@/components/ui/button';
import { useLabel } from '@/store/appStore';
import { apiGet, apiPut, apiPost } from '@/hooks/useApi';
import { toast } from 'sonner';
import { Plus, RefreshCw, Table2 } from 'lucide-react';

const COLUMNS: ColumnDef[] = [
    { key: 'name', label: 'Name', labelHi: 'नाम', type: 'text' },
    { key: 'category', label: 'Category', labelHi: 'श्रेणी', type: 'text' },
    { key: 'status', label: 'Status', labelHi: 'स्थिति', type: 'text' },
    { key: 'amount', label: 'Amount', labelHi: 'राशि', type: 'currency' },
    { key: 'quantity', label: 'Qty', labelHi: 'मात्रा', type: 'number' },
    { key: 'unit', label: 'Unit', labelHi: 'इकाई', type: 'text' },
    { key: 'date', label: 'Date', labelHi: 'तारीख', type: 'date' },
    { key: 'assigned_to', label: 'Assigned To', labelHi: 'सौंपा गया', type: 'text' },
    { key: 'location', label: 'Location', labelHi: 'स्थान', type: 'text' },
    { key: 'tags', label: 'Tags', labelHi: 'टैग', type: 'text' },
    { key: 'notes', label: 'Notes', labelHi: 'टिप्पणी', type: 'text' },
];

export default function DataTable() {
    const label = useLabel();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [masterOptions, setMasterOptions] = useState<Record<string, string[]>>({});

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [items, opts] = await Promise.all([apiGet('/items'), apiGet('/items/masters/options')]);
            setData(items.data);
            setMasterOptions(opts);
        } catch { toast.error('Failed to load items'); }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, []);

    const columnsWithOptions: ColumnDef[] = COLUMNS.map(col => ({ ...col, options: masterOptions[col.key] || [] }));

    const handleCellSave = useCallback(async (rowId: number, colKey: string, value: any) => {
        await apiPut(`/items/${rowId}/cell`, { column: colKey, value });
        setData(prev => prev.map(r => r.id === rowId ? { ...r, [colKey]: value } : r));
    }, []);

    const handleAdd = useCallback(async () => {
        await apiPost('/items', { name: '' });
        toast.success(label('Row added', 'पंक्ति जोड़ी'));
        fetchData();
    }, [fetchData, label]);

    const handleDelete = useCallback(async (ids: number[]) => {
        await apiPost('/items/bulk-delete', { ids });
        setData(prev => prev.filter(r => !ids.includes(r.id)));
        toast.success(`${ids.length} ${label('deleted', 'हटाए')}`);
    }, [label]);

    return (
        <div className="h-full flex flex-col">
            <div className="toolbar">
                <Table2 size={16} className="text-primary" />
                <span className="font-semibold text-sm">{label('Items', 'आइटम')}</span>
                <div className="toolbar-separator" />
                <Button variant="default" size="sm" onClick={handleAdd}><Plus size={14} /> {label('Add', 'जोड़ें')}</Button>
                <Button variant="ghost" size="sm" onClick={fetchData}><RefreshCw size={14} /></Button>
                <div className="flex-1" />
                <span className="text-xs text-muted-foreground">{data.length} {label('records', 'रिकॉर्ड')}</span>
            </div>
            <GenericDataGrid data={data} columns={columnsWithOptions} onCellSave={handleCellSave} onRowDelete={handleDelete} onRowAdd={handleAdd} loading={loading} tableName="items" />
        </div>
    );
}
