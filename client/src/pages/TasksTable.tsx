import React, { useState, useEffect, useCallback } from 'react';
import GenericDataGrid, { ColumnDef } from '@/components/GenericDataGrid';
import { Button } from '@/components/ui/button';
import { useLabel } from '@/store/appStore';
import { apiGet, apiPut, apiPost } from '@/hooks/useApi';
import { toast } from 'sonner';
import { Plus, RefreshCw, ListTodo } from 'lucide-react';

const COLUMNS: ColumnDef[] = [
    { key: 'title', label: 'Title', labelHi: 'शीर्षक', type: 'text' },
    { key: 'description', label: 'Description', labelHi: 'विवरण', type: 'text' },
    { key: 'priority', label: 'Priority', labelHi: 'प्राथमिकता', type: 'text' },
    { key: 'status', label: 'Status', labelHi: 'स्थिति', type: 'text' },
    { key: 'assigned_to', label: 'Assigned To', labelHi: 'सौंपा गया', type: 'text' },
    { key: 'department', label: 'Department', labelHi: 'विभाग', type: 'text' },
    { key: 'due_date', label: 'Due Date', labelHi: 'देय तिथि', type: 'date' },
    { key: 'tags', label: 'Tags', labelHi: 'टैग', type: 'text' },
    { key: 'notes', label: 'Notes', labelHi: 'टिप्पणी', type: 'text' },
];

export default function TasksTable() {
    const label = useLabel();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [masterOptions, setMasterOptions] = useState<Record<string, string[]>>({});

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [items, opts] = await Promise.all([apiGet('/tasks'), apiGet('/tasks/masters/options')]);
            setData(items.data); setMasterOptions(opts);
        } catch { toast.error('Failed to load'); }
        setLoading(false);
    }, []);
    useEffect(() => { fetchData(); }, []);

    const columnsWithOptions: ColumnDef[] = COLUMNS.map(col => ({ ...col, options: masterOptions[col.key] || [] }));
    const handleCellSave = useCallback(async (rowId: number, colKey: string, value: any) => {
        await apiPut(`/tasks/${rowId}/cell`, { column: colKey, value });
        setData(prev => prev.map(r => r.id === rowId ? { ...r, [colKey]: value } : r));
    }, []);
    const handleAdd = useCallback(async () => { await apiPost('/tasks', { title: '' }); toast.success(label('Added', 'जोड़ा')); fetchData(); }, [fetchData, label]);
    const handleDelete = useCallback(async (ids: number[]) => { await apiPost('/tasks/bulk-delete', { ids }); setData(prev => prev.filter(r => !ids.includes(r.id))); toast.success(`${ids.length} deleted`); }, []);

    return (
        <div className="h-full flex flex-col">
            <div className="toolbar">
                <ListTodo size={16} className="text-amber-500" />
                <span className="font-semibold text-sm">{label('Tasks', 'कार्य')}</span>
                <div className="toolbar-separator" />
                <Button variant="default" size="sm" onClick={handleAdd}><Plus size={14} /> {label('Add', 'जोड़ें')}</Button>
                <Button variant="ghost" size="sm" onClick={fetchData}><RefreshCw size={14} /></Button>
                <div className="flex-1" />
                <span className="text-xs text-muted-foreground">{data.length} {label('records', 'रिकॉर्ड')}</span>
            </div>
            <GenericDataGrid data={data} columns={columnsWithOptions} onCellSave={handleCellSave} onRowDelete={handleDelete} onRowAdd={handleAdd} loading={loading} tableName="tasks" />
        </div>
    );
}
