import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLabel } from '@/store/appStore';
import { apiGet } from '@/hooks/useApi';
import { toast } from 'sonner';
import { ShieldCheck, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

export default function DataValidator() {
    const label = useLabel();
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        apiGet('/data-validator').then(r => setData(r.data)).catch(() => toast.error('Failed'));
    }, []);

    const getIcon = (severity: string) => {
        if (severity === 'error') return <AlertCircle size={16} className="text-red-500" />;
        if (severity === 'warning') return <AlertTriangle size={16} className="text-amber-500" />;
        return <CheckCircle size={16} className="text-emerald-500" />;
    };

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header">
                <h1 className="page-title flex items-center gap-2"><ShieldCheck size={24} className="text-primary" /> {label('Data Validator', 'डेटा वैलिडेटर')}</h1>
                {data && (
                    <div className="flex gap-2">
                        <Badge variant="destructive">{data.errors} errors</Badge>
                        <Badge variant="warning">{data.warnings} warnings</Badge>
                        <Badge variant="success">{data.passed} passed</Badge>
                    </div>
                )}
            </div>
            <div className="space-y-3">
                {data?.rules?.map((rule: any) => (
                    <Card key={rule.id} className={rule.issueCount > 0 ? 'border-l-4 border-l-' + (rule.severity === 'error' ? 'red-500' : 'amber-500') : ''}>
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {getIcon(rule.issueCount > 0 ? rule.severity : 'pass')}
                                    <span className="font-medium text-sm">{rule.name}</span>
                                    <Badge variant="outline" className="text-[10px]">{rule.table}</Badge>
                                </div>
                                <Badge variant={rule.issueCount > 0 ? 'destructive' : 'success'}>{rule.issueCount} issues</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{rule.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
