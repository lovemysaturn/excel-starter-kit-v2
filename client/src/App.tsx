import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAppStore } from '@/store/appStore';
import { apiGet } from '@/hooks/useApi';

import TopNav from '@/components/TopNav';
import StatusBar from '@/components/StatusBar';
import CommandPalette from '@/components/CommandPalette';
import WisdomOverlay from '@/components/WisdomOverlay';

import Dashboard from '@/pages/Dashboard';
import DataTable from '@/pages/DataTable';
import TransactionsTable from '@/pages/TransactionsTable';
import TasksTable from '@/pages/TasksTable';
import ContactsTable from '@/pages/ContactsTable';
import ManageWorkbooks from '@/pages/ManageWorkbooks';
import BackupManager from '@/pages/BackupManager';
import DocumentsHub from '@/pages/DocumentsHub';
import FieldHealth from '@/pages/FieldHealth';
import DataValidator from '@/pages/DataValidator';
import AuditTrail from '@/pages/AuditTrail';
import SettingsPage from '@/pages/Settings';
import KeyboardShortcuts from '@/pages/KeyboardShortcuts';
import SmartImport from '@/pages/SmartImport';
import ImportHistory from '@/pages/ImportHistory';

import GlobalSearch from '@/components/GlobalSearch';

export default function App() {
    const { language, toggleLanguage, setLanguage, setTheme, updateSettings } = useAppStore();
    const location = useLocation();
    const [wisdomText, setWisdomText] = useState('');

    // Load settings on mount
    useEffect(() => {
        apiGet('/settings').then(res => {
            const data = res.data;
            updateSettings(data);
            if (data.language) setLanguage(data.language as 'en' | 'hi');
            if (data.theme) setTheme(data.theme as 'light' | 'dark');
        }).catch(() => { });
    }, []);

    // Wisdom ticker
    useEffect(() => {
        const showWisdom = () => {
            apiGet('/settings/wisdom-points/random').then(res => {
                if (res.data) setWisdomText(language === 'hi' && res.data.text_hi ? res.data.text_hi : res.data.text);
            }).catch(() => { });
        };
        const interval = setInterval(showWisdom, 30000);
        const initialTimeout = setTimeout(showWisdom, 5000);
        return () => { clearInterval(interval); clearTimeout(initialTimeout); };
    }, [language]);

    // Global keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'L') { e.preventDefault(); toggleLanguage(); }
            if (e.key === 'F1') { e.preventDefault(); window.location.hash = '#/shortcuts'; }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [toggleLanguage]);

    return (
        <>
            <Toaster position="bottom-right" richColors closeButton />
            <CommandPalette />
            <GlobalSearch />
            {wisdomText && <WisdomOverlay text={wisdomText} onClose={() => setWisdomText('')} />}

            <div className="h-screen flex flex-col">
                <TopNav />
                <main className="flex-1 min-h-0 overflow-hidden">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/data" element={<DataTable />} />
                        <Route path="/transactions" element={<TransactionsTable />} />
                        <Route path="/tasks" element={<TasksTable />} />
                        <Route path="/contacts" element={<ContactsTable />} />
                        <Route path="/workbooks" element={<ManageWorkbooks />} />
                        <Route path="/backup" element={<BackupManager />} />
                        <Route path="/documents" element={<DocumentsHub />} />
                        <Route path="/field-health" element={<FieldHealth />} />
                        <Route path="/data-validator" element={<DataValidator />} />
                        <Route path="/audit" element={<AuditTrail />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/shortcuts" element={<KeyboardShortcuts />} />
                        <Route path="/import" element={<SmartImport />} />
                        <Route path="/import-history" element={<ImportHistory />} />
                    </Routes>
                </main>
                <StatusBar />
            </div>
        </>
    );
}
