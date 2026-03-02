import React, { useState, useEffect, useCallback } from 'react';
import GenericDataGrid, { ColumnDef } from '@/components/GenericDataGrid';
import { Button } from '@/components/ui/button';
import { useLabel } from '@/store/appStore';
import { apiGet, apiPut, apiPost } from '@/hooks/useApi';
import { toast } from 'sonner';
import { Plus, RefreshCw, Users } from 'lucide-react';

const COLUMNS: ColumnDef[] = [
    { key: 'name', label: 'Name', labelHi: 'नाम', type: 'text' },
    { key: 'company', label: 'Company', labelHi: 'कंपनी', type: 'text' },
    { key: 'type', label: 'Type', labelHi: 'प्रकार', type: 'text' },
    { key: 'email', label: 'Email', labelHi: 'ईमेल', type: 'text' },
    { key: 'phone', label: 'Phone', labelHi: 'फोन', type: 'text' },
    { key: 'city', label: 'City', labelHi: 'शहर', type: 'text' },
    { key: 'gst_no', label: 'GST No', labelHi: 'GST नं.', type: 'text' },
    { key: 'address', label: 'Address', labelHi: 'पता', type: 'text' },
    { key: 'notes', label: 'Notes', labelHi: 'टिप्पणी', type: 'text' },
];

export default function ContactsTable() {
    const label = useLabel();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [masterOptions, setMasterOptions] = useState<Record<string, string[]>>({});

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [items, opts] = await Promise.all([apiGet('/contacts'), apiGet('/contacts/masters/options')]);
            setData(items.data); setMasterOptions(opts);
        } catch { toast.error('Failed to load'); }
        setLoading(false);
    }, []);
    useEffect(() => { fetchData(); }, []);

    const columnsWithOptions: ColumnDef[] = COLUMNS.map(col => ({ ...col, options: masterOptions[col.key] || [] }));
    const handleCellSave = useCallback(async (rowId: number, colKey: string, value: any) => {
        await apiPut(`/contacts/${rowId}/cell`, { column: colKey, value });
        setData(prev => prev.map(r => r.id === rowId ? { ...r, [colKey]: value } : r));
    }, []);
    const handleAdd = useCallback(async () => { await apiPost('/contacts', { name: '' }); toast.success(label('Added', 'जोड़ा')); fetchData(); }, [fetchData, label]);
    const handleDelete = useCallback(async (ids: number[]) => { await apiPost('/contacts/bulk-delete', { ids }); setData(prev => prev.filter(r => !ids.includes(r.id))); toast.success(`${ids.length} deleted`); }, []);

    return (
        <div className="h-full flex flex-col">
            <div className="toolbar">
                <Users size={16} className="text-violet-500" />
                <span className="font-semibold text-sm">{label('Contacts', 'संपर्क')}</span>
                <div className="toolbar-separator" />
                <Button variant="default" size="sm" onClick={handleAdd}><Plus size={14} /> {label('Add', 'जोड़ें')}</Button>
                <Button variant="ghost" size="sm" onClick={fetchData}><RefreshCw size={14} /></Button>
                <div className="flex-1" />
                <span className="text-xs text-muted-foreground">{data.length} {label('records', 'रिकॉर्ड')}</span>
            </div>
            <GenericDataGrid data={data} columns={columnsWithOptions} onCellSave={handleCellSave} onRowDelete={handleDelete} onRowAdd={handleAdd} loading={loading} tableName="contacts" />
        </div>
    );
}
