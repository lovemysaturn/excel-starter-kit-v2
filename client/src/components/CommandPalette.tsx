import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Command } from 'cmdk';
import {
    LayoutDashboard, Table2, BookOpen, HardDrive, FileText,
    Settings, Stethoscope, ShieldCheck, Keyboard, Receipt,
    ListTodo, Users, History, Moon, Sun, Globe, Upload,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';

interface PaletteItem {
    id: string;
    title: string;
    titleHi: string;
    icon: React.ReactNode;
    action?: () => void;
    path?: string;
    keywords?: string;
    category: string;
}

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { language, toggleLanguage, toggleTheme, theme } = useAppStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                setOpen(o => !o);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const items: PaletteItem[] = useMemo(() => [
        { id: 'dashboard', title: 'Dashboard', titleHi: 'डैशबोर्ड', path: '/', category: 'Pages', icon: <LayoutDashboard size={16} />, keywords: 'home main' },
        { id: 'items', title: 'Items', titleHi: 'आइटम', path: '/data', category: 'Pages', icon: <Table2 size={16} />, keywords: 'items grid excel' },
        { id: 'transactions', title: 'Transactions', titleHi: 'लेनदेन', path: '/transactions', category: 'Pages', icon: <Receipt size={16} />, keywords: 'payments invoices financial' },
        { id: 'tasks', title: 'Tasks', titleHi: 'कार्य', path: '/tasks', category: 'Pages', icon: <ListTodo size={16} />, keywords: 'todo activities' },
        { id: 'contacts', title: 'Contacts', titleHi: 'संपर्क', path: '/contacts', category: 'Pages', icon: <Users size={16} />, keywords: 'vendors clients' },
        { id: 'workbooks', title: 'Workbooks', titleHi: 'वर्कबुक्स', path: '/workbooks', category: 'Pages', icon: <BookOpen size={16} />, keywords: 'sheets views' },
        { id: 'backup', title: 'Backup Manager', titleHi: 'बैकअप', path: '/backup', category: 'Pages', icon: <HardDrive size={16} />, keywords: 'backup restore' },
        { id: 'documents', title: 'Documents', titleHi: 'दस्तावेज़', path: '/documents', category: 'Pages', icon: <FileText size={16} />, keywords: 'files upload' },
        { id: 'field-health', title: 'Field Health', titleHi: 'फील्ड स्वास्थ्य', path: '/field-health', category: 'Pages', icon: <Stethoscope size={16} />, keywords: 'completeness quality' },
        { id: 'validator', title: 'Data Validator', titleHi: 'डेटा वैलिडेटर', path: '/data-validator', category: 'Pages', icon: <ShieldCheck size={16} />, keywords: 'validation rules' },
        { id: 'audit', title: 'Audit Trail', titleHi: 'ऑडिट ट्रेल', path: '/audit', category: 'Pages', icon: <History size={16} />, keywords: 'changelog history' },
        { id: 'settings', title: 'Settings', titleHi: 'सेटिंग्स', path: '/settings', category: 'Pages', icon: <Settings size={16} />, keywords: 'preferences config' },
        { id: 'shortcuts', title: 'Keyboard Shortcuts', titleHi: 'शॉर्टकट', path: '/shortcuts', category: 'Pages', icon: <Keyboard size={16} />, keywords: 'keys help F1' },
        { id: 'import', title: 'Smart Import', titleHi: 'स्मार्ट आयात', path: '/import', category: 'Pages', icon: <Upload size={16} />, keywords: 'import excel upload file csv' },
        { id: 'import-history', title: 'Import History', titleHi: 'आयात इतिहास', path: '/import-history', category: 'Pages', icon: <History size={16} />, keywords: 'import log history past' },
        { id: 'toggle-theme', title: 'Toggle Theme', titleHi: 'थीम बदलें', category: 'Actions', icon: theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />, action: toggleTheme, keywords: 'dark light mode' },
        { id: 'toggle-lang', title: 'Toggle Language', titleHi: 'भाषा बदलें', category: 'Actions', icon: <Globe size={16} />, action: toggleLanguage, keywords: 'hindi english' },
    ], [theme, toggleTheme, toggleLanguage]);

    const handleSelect = (item: PaletteItem) => {
        setOpen(false);
        if (item.action) item.action();
        else if (item.path) navigate(item.path);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)}>
            <div className="fixed inset-0 bg-black/50" />
            <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[101]" onClick={e => e.stopPropagation()}>
                <Command className="rounded-xl border border-border bg-popover shadow-2xl overflow-hidden animate-slide-down">
                    <Command.Input
                        placeholder={language === 'hi' ? 'कमांड खोजें...' : 'Type a command...'}
                        className="w-full px-4 py-3 text-sm bg-transparent border-b border-border outline-none placeholder:text-muted-foreground"
                    />
                    <Command.List className="max-h-[300px] overflow-y-auto p-2">
                        <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                            {language === 'hi' ? 'कोई परिणाम नहीं' : 'No results found.'}
                        </Command.Empty>
                        {['Pages', 'Actions'].map(cat => {
                            const catItems = items.filter(i => i.category === cat);
                            return (
                                <Command.Group key={cat} heading={cat} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                                    {catItems.map(item => (
                                        <Command.Item
                                            key={item.id}
                                            value={`${item.title} ${item.titleHi} ${item.keywords || ''}`}
                                            onSelect={() => handleSelect(item)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                                        >
                                            <span className="text-muted-foreground">{item.icon}</span>
                                            <span>{language === 'hi' ? item.titleHi : item.title}</span>
                                            {item.path && item.path === location.pathname && (
                                                <span className="ml-auto text-[10px] text-muted-foreground">current</span>
                                            )}
                                        </Command.Item>
                                    ))}
                                </Command.Group>
                            );
                        })}
                    </Command.List>
                    <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[11px] text-muted-foreground">
                        <span>↑↓ navigate</span>
                        <span>↵ select</span>
                        <span>esc close</span>
                    </div>
                </Command>
            </div>
        </div>
    );
}
