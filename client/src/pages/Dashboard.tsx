import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLabel } from '@/store/appStore';
import { apiGet } from '@/hooks/useApi';
import { Table2, Receipt, ListTodo, Users, AlertTriangle, CheckCircle, Clock, TrendingUp, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Dashboard() {
    const label = useLabel();
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiGet('/stats').then(res => {
            setStats(res);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const totals = stats?.totals || { items: 0, transactions: 0, tasks: 0, contacts: 0 };

    const tiles = [
        { title: label('Items', 'आइटम'), count: totals.items, icon: Table2, path: '/data', color: 'text-primary', bg: 'bg-primary/10' },
        { title: label('Transactions', 'लेनदेन'), count: totals.transactions, icon: Receipt, path: '/transactions', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { title: label('Tasks', 'कार्य'), count: totals.tasks, icon: ListTodo, path: '/tasks', color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { title: label('Contacts', 'संपर्क'), count: totals.contacts, icon: Users, path: '/contacts', color: 'text-violet-500', bg: 'bg-violet-500/10' },
    ];

    const renderPie = (data: any[], title: string) => {
        if (!data || data.length === 0) return null;
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2"><Activity size={16} className="text-primary" /> {title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                                paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                labelLine={false} fontSize={10}>
                                {data.map((_: any, i: number) => (
                                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v: any) => [v, 'Count']} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        );
    };

    const renderBar = (data: any[], title: string) => {
        if (!data || data.length === 0) return null;
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2"><TrendingUp size={16} className="text-amber-500" /> {title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {data.map((_: any, i: number) => (
                                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        );
    };

    const renderActivity = (data: any[]) => {
        if (!data || data.length === 0) return null;
        const formatted = data.map((d: any) => ({
            ...d,
            name: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        }));
        return (
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2"><Clock size={16} className="text-emerald-500" /> {label('Activity · Last 7 Days', 'गतिविधि · पिछले 7 दिन')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={formatted} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <defs>
                                <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#activityGrad)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{label('Dashboard', 'डैशबोर्ड')}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{label('Excel Starter Kit v2 — Overview', 'एक्सेल स्टार्टर किट v2 — अवलोकन')}</p>
                </div>
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {tiles.map(tile => (
                    <Card key={tile.title} className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5" onClick={() => navigate(tile.path)}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{tile.title}</CardTitle>
                            <div className={`p-2 rounded-lg ${tile.bg}`}><tile.icon size={18} className={tile.color} /></div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{loading ? '—' : tile.count}</div>
                            <p className="text-xs text-muted-foreground mt-1">{label('total records', 'कुल रिकॉर्ड')}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts */}
            {stats && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                        {renderPie(stats.itemsByCategory, label('Items by Category', 'श्रेणी के अनुसार आइटम'))}
                        {renderBar(stats.tasksByStatus, label('Tasks by Status', 'स्थिति के अनुसार कार्य'))}
                        {renderPie(stats.contactsByType, label('Contacts by Type', 'प्रकार के अनुसार संपर्क'))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                        {renderActivity(stats.recentActivity)}
                        {renderBar(stats.txnByStatus, label('Transactions by Status', 'स्थिति के अनुसार लेनदेन'))}
                    </div>
                </>
            )}

            {/* Feature & shortcuts cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp size={16} className="text-primary" /> {label('Quick Stats', 'त्वरित आंकड़े')}</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">{label('Total Records', 'कुल रिकॉर्ड')}</span> <span className="font-medium">{totals.items + totals.transactions + totals.tasks + totals.contacts}</span></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><CheckCircle size={16} className="text-emerald-500" /> {label('Features', 'सुविधाएं')}</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {['Smart Import', 'Global Search', 'Audit Trail', 'Charts', 'PDF Print', 'Excel Export'].map(f => (
                            <div key={f} className="flex items-center gap-2 text-sm"><CheckCircle size={12} className="text-emerald-500" /> {f}</div>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock size={16} className="text-amber-500" /> {label('Shortcuts', 'शॉर्टकट')}</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {[['Ctrl+P', 'Command Palette'], ['Ctrl+Shift+F', 'Global Search'], ['Ctrl+F', 'Find'], ['Ctrl+Z', 'Undo'], ['F2', 'Edit Cell'], ['Space', 'Select Row']].map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between text-sm"><span className="key-badge">{k}</span> <span className="text-muted-foreground">{v}</span></div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
