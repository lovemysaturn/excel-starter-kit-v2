import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLabel } from '@/store/appStore';
import { apiGet, apiPost, apiDelete } from '@/hooks/useApi';
import { toast } from 'sonner';
import { HardDrive, Plus, Download, RotateCcw, Trash2 } from 'lucide-react';

export default function BackupManager() {
    const label = useLabel();
    const [backups, setBackups] = useState<any[]>([]);
    const [dbSize, setDbSize] = useState(0);

    const fetchData = async () => {
        try { const res = await apiGet('/backup'); setBackups(res.data || []); setDbSize(res.dbSize || 0); }
        catch { toast.error('Failed to load backups'); }
    };
    useEffect(() => { fetchData(); }, []);

    const handleCreate = async () => { await apiPost('/backup/create'); toast.success('Backup created!'); fetchData(); };
    const handleRestore = async (name: string) => { if (confirm(`Restore from ${name}?`)) { await apiPost('/backup/restore', { name }); toast.success('Restored!'); } };
    const handleDelete = async (name: string) => { await apiDelete(`/backup/${name}`); toast.success('Deleted'); fetchData(); };

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header">
                <h1 className="page-title flex items-center gap-2"><HardDrive size={24} className="text-primary" /> {label('Backup Manager', 'बैकअप प्रबंधक')}</h1>
                <div className="flex items-center gap-3">
                    <Badge variant="outline">{label('DB Size', 'डीबी आकार')}: {(dbSize / 1024).toFixed(1)} KB</Badge>
                    <Button onClick={handleCreate}><Plus size={14} /> {label('Create Backup', 'बैकअप बनाएं')}</Button>
                </div>
            </div>
            <div className="space-y-3">
                {backups.map(b => (
                    <Card key={b.name}>
                        <CardContent className="flex items-center justify-between py-4">
                            <div>
                                <p className="font-medium text-sm">{b.name}</p>
                                <p className="text-xs text-muted-foreground">{new Date(b.created).toLocaleString()} · {(b.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleRestore(b.name)}><RotateCcw size={14} /> {label('Restore', 'पुनर्स्थापित')}</Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(b.name)}><Trash2 size={14} /></Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {backups.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">{label('No backups yet', 'कोई बैकअप नहीं')}</p>}
            </div>
        </div>
    );
}
