import React, { useEffect, useState } from 'react';
import { useAppStore, useLabel } from '@/store/appStore';
import { Button } from './ui/button';
import { X, Sparkles } from 'lucide-react';

interface WisdomOverlayProps {
    text: string;
    onClose: () => void;
}

export default function WisdomOverlay({ text, onClose }: WisdomOverlayProps) {
    const label = useLabel();
    const [countdown, setCountdown] = useState(60);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(c => {
                if (c <= 1) { onClose(); return 0; }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [onClose]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-card border border-border rounded-xl shadow-2xl p-8 max-w-md mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-2 mb-4 text-warning">
                    <Sparkles size={20} />
                    <span className="font-semibold">{label('Wisdom of the Day', 'आज का ज्ञान')}</span>
                </div>
                <p className="text-lg font-medium mb-6 leading-relaxed">{text}</p>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{label('Auto-dismiss in', 'में ख़ारिज')} {countdown}s</span>
                    <Button variant="outline" size="sm" onClick={onClose}>
                        <X size={14} /> {label('Close', 'बंद')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
