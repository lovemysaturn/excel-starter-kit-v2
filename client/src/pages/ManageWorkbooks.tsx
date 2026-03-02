import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLabel } from '@/store/appStore';
import { apiGet, apiPost, apiDelete } from '@/hooks/useApi';
import { toast } from 'sonner';
import { BookOpen, Plus, Trash2, Pin } from 'lucide-react';

export default function ManageWorkbooks() {
    const label = useLabel();
    const [workbooks, setWorkbooks] = useState<any[]>([]);

    const fetchData = async () => {
        try { const res = await apiGet('/workbooks'); setWorkbooks(res.data || []); }
        catch { toast.error('Failed to load workbooks'); }
    };
    useEffect(() => { fetchData(); }, []);

    const handleDelete = async (id: string) => { await apiDelete(`/workbooks/${id}`); toast.success('Deleted'); fetchData(); };

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header">
                <h1 className="page-title flex items-center gap-2"><BookOpen size={24} className="text-primary" /> {label('Workbooks', 'वर्कबुक्स')}</h1>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {workbooks.map(wb => (
                    <Card key={wb.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{wb.icon}</span>
                                <CardTitle className="text-sm">{wb.name}</CardTitle>
                            </div>
                            <div className="flex gap-1">
                                {wb.is_prebuilt === 1 && <Badge variant="secondary">Built-in</Badge>}
                                {wb.is_prebuilt !== 1 && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(wb.id)}><Trash2 size={12} /></Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground mb-2">Table: {wb.table_name}</p>
                            <p className="text-xs text-muted-foreground">{JSON.parse(wb.columns || '[]').length} columns · {JSON.parse(wb.filters || '[]').length} filters</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
