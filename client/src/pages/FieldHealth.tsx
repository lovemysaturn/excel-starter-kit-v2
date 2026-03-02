import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLabel } from '@/store/appStore';
import { apiGet } from '@/hooks/useApi';
import { toast } from 'sonner';
import { Stethoscope, RefreshCw } from 'lucide-react';

export default function FieldHealth() {
    const label = useLabel();
    const [data, setData] = useState<any>(null);
    const [table, setTable] = useState('items');

    const fetchData = async () => {
        try { const res = await apiGet(`/field-health?table=${table}`); setData(res.data); }
        catch { toast.error('Failed to load'); }
    };
    useEffect(() => { fetchData(); }, [table]);

    const tables = ['items', 'transactions', 'tasks', 'contacts'];

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header">
                <h1 className="page-title flex items-center gap-2"><Stethoscope size={24} className="text-primary" /> {label('Field Health', 'फील्ड स्वास्थ्य')}</h1>
                <div className="flex gap-2">
                    {tables.map(t => (
                        <Button key={t} variant={table === t ? 'default' : 'outline'} size="sm" onClick={() => setTable(t)}>{t}</Button>
                    ))}
                </div>
            </div>
            {data && (
                <>
                    <div className="mb-6">
                        <div className="flex items-center gap-4 mb-2">
                            <Badge variant={data.avgCompleteness > 80 ? 'success' : data.avgCompleteness > 50 ? 'warning' : 'destructive'}>
                                {data.avgCompleteness}% {label('complete', 'पूर्ण')}
                            </Badge>
                            <span className="text-sm text-muted-foreground">{data.total} {label('records in', 'रिकॉर्ड')} {data.tableName}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2"><div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${data.avgCompleteness}%` }} /></div>
                    </div>
                    <div className="grid gap-3">
                        {data.fields?.map((f: any) => (
                            <Card key={f.column}>
                                <CardContent className="flex items-center justify-between py-3">
                                    <div>
                                        <p className="font-medium text-sm">{f.column}</p>
                                        <p className="text-xs text-muted-foreground">{f.filled}/{f.total} filled · {f.distinct} distinct</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 bg-muted rounded-full h-1.5"><div className={`rounded-full h-1.5 ${f.completeness > 80 ? 'bg-emerald-500' : f.completeness > 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${f.completeness}%` }} /></div>
                                        <Badge variant={f.completeness > 80 ? 'success' : f.completeness > 50 ? 'warning' : 'destructive'}>{f.completeness}%</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
