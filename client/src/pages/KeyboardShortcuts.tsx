import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useLabel } from '@/store/appStore';
import { Keyboard } from 'lucide-react';

const SHORTCUTS = [
    ['Navigation', [
        ['Arrow Keys', 'Move between cells'],
        ['Tab / Shift+Tab', 'Next / previous cell'],
        ['Home / End', 'First / last column'],
        ['Ctrl+Home / End', 'First / last row'],
        ['Page Up / Down', 'Jump 10 rows'],
    ]],
    ['Editing', [
        ['Enter / F2', 'Start editing cell'],
        ['Escape', 'Cancel editing'],
        ['Type any character', 'Quick edit (overwrite)'],
    ]],
    ['Selection', [
        ['Space', 'Toggle row selection'],
        ['Ctrl+A', 'Select all rows'],
        ['Delete', 'Delete selected rows'],
    ]],
    ['Tools', [
        ['Ctrl+P', 'Command Palette'],
        ['Ctrl+F', 'Find & Replace'],
        ['Ctrl+Z', 'Undo last edit'],
        ['Ctrl+Shift+L', 'Toggle language'],
        ['F1', 'Keyboard shortcuts'],
    ]],
] as const;

export default function KeyboardShortcuts() {
    const label = useLabel();
    return (
        <div className="page-container animate-fade-in">
            <div className="page-header">
                <h1 className="page-title flex items-center gap-2"><Keyboard size={24} className="text-primary" /> {label('Keyboard Shortcuts', 'कीबोर्ड शॉर्टकट')}</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                {SHORTCUTS.map(([section, keys]) => (
                    <Card key={section as string}>
                        <CardHeader><CardTitle className="text-sm">{section as string}</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {(keys as any[]).map(([key, desc]: [string, string]) => (
                                <div key={key} className="flex items-center justify-between">
                                    <span className="key-badge">{key}</span>
                                    <span className="text-sm text-muted-foreground">{desc}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
