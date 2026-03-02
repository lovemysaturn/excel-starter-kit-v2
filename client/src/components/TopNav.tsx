import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore, useLabel } from '@/store/appStore';
import { Button } from './ui/button';
import {
    LayoutDashboard, Table2, BookOpen, HardDrive, FileText,
    Settings, Keyboard, Stethoscope, ShieldCheck, Globe, Moon, Sun,
    Receipt, ListTodo, Users, History, Upload,
} from 'lucide-react';

const NAV_ITEMS = [
    { path: '/', icon: <LayoutDashboard size={16} />, en: 'Dashboard', hi: 'डैशबोर्ड' },
    { path: '/data', icon: <Table2 size={16} />, en: 'Items', hi: 'आइटम' },
    { path: '/transactions', icon: <Receipt size={16} />, en: 'Transactions', hi: 'लेनदेन' },
    { path: '/tasks', icon: <ListTodo size={16} />, en: 'Tasks', hi: 'कार्य' },
    { path: '/contacts', icon: <Users size={16} />, en: 'Contacts', hi: 'संपर्क' },
    { path: '/workbooks', icon: <BookOpen size={16} />, en: 'Workbooks', hi: 'वर्कबुक्स' },
    { path: '/backup', icon: <HardDrive size={16} />, en: 'Backup', hi: 'बैकअप' },
    { path: '/documents', icon: <FileText size={16} />, en: 'Documents', hi: 'दस्तावेज़' },
    { path: '/field-health', icon: <Stethoscope size={16} />, en: 'Health', hi: 'स्वास्थ्य' },
    { path: '/data-validator', icon: <ShieldCheck size={16} />, en: 'Validator', hi: 'वैलिडेटर' },
    { path: '/audit', icon: <History size={16} />, en: 'Audit', hi: 'ऑडिट' },
    { path: '/import', icon: <Upload size={16} />, en: 'Import', hi: 'आयात' },
    { path: '/settings', icon: <Settings size={16} />, en: 'Settings', hi: 'सेटिंग्स' },
    { path: '/shortcuts', icon: <Keyboard size={16} />, en: 'Keys', hi: 'कीज़' },
];

export default function TopNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const { language, toggleLanguage, theme, toggleTheme } = useAppStore();
    const label = useLabel();

    return (
        <nav className="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-card overflow-x-auto shrink-0">
            <div className="flex items-center gap-1 mr-2">
                <span className="text-lg font-bold text-primary mr-1">📊</span>
                <span className="text-sm font-semibold hidden sm:inline">{label('Starter Kit v2', 'स्टार्टर किट v2')}</span>
            </div>

            <div className="flex items-center gap-0.5 flex-1 overflow-x-auto">
                {NAV_ITEMS.map(item => (
                    <Button
                        key={item.path}
                        variant={location.pathname === item.path ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => navigate(item.path)}
                        className={`gap-1.5 text-xs shrink-0 ${location.pathname === item.path ? 'bg-primary/10 text-primary font-semibold' : ''}`}
                    >
                        {item.icon}
                        <span className="hidden lg:inline">{language === 'hi' ? item.hi : item.en}</span>
                    </Button>
                ))}
            </div>

            <div className="flex items-center gap-1 ml-2 shrink-0">
                <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </Button>
                <Button variant="ghost" size="icon" onClick={toggleLanguage} title="Toggle language (Ctrl+Shift+L)">
                    <Globe size={16} />
                </Button>
                <span className="text-[10px] text-muted-foreground hidden xl:inline">Ctrl+P</span>
            </div>
        </nav>
    );
}
