import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLabel } from '@/store/appStore';
import { apiGet } from '@/hooks/useApi';
import { toast } from 'sonner';
import { History, RefreshCw, Edit, Plus, Trash2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function AuditTrail() {
    const label = useLabel();
    const [logs, setLogs] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [filter, setFilter] = useState('');

    const fetchData = async () => {
        try {
            const [logRes, statsRes] = await Promise.all([
                apiGet(`/change-log${filter ? `?table=${filter}` : ''}`),
                apiGet('/change-log/stats'),
            ]);
            setLogs(logRes.data || []);
            setStats(statsRes.data);
        } catch { toast.error('Failed to load'); }
    };
    useEffect(() => { fetchData(); }, [filter]);

    const actionIcon = (action: string) => {
        if (action === 'create') return <Plus size={12} className="text-emerald-500" />;
        if (action === 'update') return <Edit size={12} className="text-primary" />;
        return <Trash2 size={12} className="text-red-500" />;
    };

    const tables = ['', 'items', 'transactions', 'tasks', 'contacts'];

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header">
                <h1 className="page-title flex items-center gap-2"><History size={24} className="text-primary" /> {label('Audit Trail', 'ऑडिट ट्रेल')}</h1>
                <Button variant="ghost" size="sm" onClick={fetchData}><RefreshCw size={14} /></Button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{stats.today}</p><p className="text-xs text-muted-foreground">{label('Today', 'आज')}</p></CardContent></Card>
                    <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{stats.week}</p><p className="text-xs text-muted-foreground">{label('This Week', 'इस सप्ताह')}</p></CardContent></Card>
                    <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">{label('Total', 'कुल')}</p></CardContent></Card>
                </div>
            )}

            {/* Filter */}
            <div className="flex gap-2 mb-4">
                {tables.map(t => (
                    <Button key={t || 'all'} variant={filter === t ? 'default' : 'outline'} size="sm" onClick={() => setFilter(t)}>
                        {t || label('All', 'सभी')}
                    </Button>
                ))}
            </div>

            {/* Log entries */}
            <div className="space-y-2">
                {logs.map(log => (
                    <Card key={log.id}>
                        <CardContent className="flex items-center gap-3 py-3">
                            {actionIcon(log.action)}
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px]">{log.table_name}</Badge>
                                    <span className="text-xs font-medium">#{log.row_id}</span>
                                    {log.column_name && <span className="text-xs text-muted-foreground">.{log.column_name}</span>}
                                </div>
                                {log.action === 'update' && log.old_value && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        <span className="line-through">{log.old_value}</span> → <span className="font-medium">{log.new_value}</span>
                                    </p>
                                )}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                                {log.created_at ? formatDistanceToNow(new Date(log.created_at + 'Z'), { addSuffix: true }) : ''}
                            </span>
                        </CardContent>
                    </Card>
                ))}
                {logs.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">{label('No changes recorded yet', 'अभी तक कोई बदलाव दर्ज नहीं')}</p>}
            </div>
        </div>
    );
}
