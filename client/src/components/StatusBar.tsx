import React from 'react';
import { useAppStore, useLabel } from '@/store/appStore';
import { Database, Clock, Hash, Sigma } from 'lucide-react';

export default function StatusBar() {
    const { statusBar } = useAppStore();
    const label = useLabel();

    return (
        <div className="flex items-center gap-4 px-4 py-1.5 border-t border-border bg-card text-[11px] text-muted-foreground shrink-0">
            <div className="flex items-center gap-1.5">
                <Database size={12} />
                <span>{statusBar.totalRecords} {label('records', 'रिकॉर्ड')}</span>
            </div>
            {statusBar.selectedCount > 0 && (
                <div className="flex items-center gap-1.5">
                    <Hash size={12} />
                    <span>{statusBar.selectedCount} {label('selected', 'चयनित')}</span>
                </div>
            )}
            {statusBar.sumAmount > 0 && (
                <div className="flex items-center gap-1.5">
                    <Sigma size={12} />
                    <span>₹{statusBar.sumAmount.toLocaleString('en-IN')}</span>
                </div>
            )}
            <div className="flex-1" />
            {statusBar.lastSaved && (
                <div className="flex items-center gap-1.5">
                    <Clock size={12} />
                    <span>{label('Saved', 'सहेजा')}: {statusBar.lastSaved}</span>
                </div>
            )}
            <div className="flex items-center gap-3">
                <span className="key-badge">Ctrl+P</span>
                <span className="key-badge">F1</span>
                <span className="key-badge">Ctrl+Z</span>
            </div>
        </div>
    );
}
