import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAppStore, useLabel } from '@/store/appStore';
import { apiGet, apiPut } from '@/hooks/useApi';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Globe, Moon, Sparkles, Database } from 'lucide-react';

export default function SettingsPage() {
    const { language, setLanguage, theme, setTheme, settings, updateSettings } = useAppStore();
    const label = useLabel();
    const [localSettings, setLocalSettings] = useState<Record<string, string>>({});

    useEffect(() => {
        apiGet('/settings').then(res => { setLocalSettings(res.data); updateSettings(res.data); }).catch(() => { });
    }, []);

    const handleSave = async () => {
        try {
            await apiPut('/settings', { ...localSettings, language, theme });
            toast.success(label('Settings saved!', 'सेटिंग्स सहेजी!'));
        } catch { toast.error('Failed to save'); }
    };

    const updateLocal = (key: string, value: string) => setLocalSettings(prev => ({ ...prev, [key]: value }));

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header">
                <h1 className="page-title flex items-center gap-2"><SettingsIcon size={24} className="text-primary" /> {label('Settings', 'सेटिंग्स')}</h1>
                <Button onClick={handleSave}>{label('Save', 'सहेजें')}</Button>
            </div>
            <div className="grid gap-4 max-w-2xl">
                <Card>
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Globe size={16} /> {label('Language', 'भाषा')}</CardTitle></CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{label('Toggle Hindi/English', 'हिंदी/अंग्रेज़ी बदलें')}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm">EN</span>
                            <Switch checked={language === 'hi'} onCheckedChange={v => setLanguage(v ? 'hi' : 'en')} />
                            <span className="text-sm">हिंदी</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Moon size={16} /> {label('Theme', 'थीम')}</CardTitle></CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{label('Dark mode', 'डार्क मोड')}</span>
                        <Switch checked={theme === 'dark'} onCheckedChange={v => setTheme(v ? 'dark' : 'light')} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Sparkles size={16} /> {label('Wisdom Ticker', 'ज्ञान टिकर')}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{label('Enable', 'सक्षम')}</span>
                            <Switch checked={localSettings.wisdom_enabled === 'true'} onCheckedChange={v => updateLocal('wisdom_enabled', String(v))} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{label('Interval (seconds)', 'अंतराल (सेकंड)')}</span>
                            <Input value={localSettings.wisdom_interval || '30'} onChange={e => updateLocal('wisdom_interval', e.target.value)} className="w-20 h-8 text-center text-sm" type="number" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Database size={16} /> {label('Data', 'डेटा')}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{label('Auto backup', 'ऑटो बैकअप')}</span>
                            <Switch checked={localSettings.auto_backup === 'true'} onCheckedChange={v => updateLocal('auto_backup', String(v))} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{label('Rows per page', 'पृष्ठ प्रति पंक्ति')}</span>
                            <Input value={localSettings.rows_per_page || '100'} onChange={e => updateLocal('rows_per_page', e.target.value)} className="w-20 h-8 text-center text-sm" type="number" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
