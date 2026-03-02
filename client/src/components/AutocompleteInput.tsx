import React, { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';

interface AutocompleteInputProps {
    value: string;
    options: string[];
    type: string;
    onChange: (v: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
    onTab?: (shift: boolean) => void;
}

export default function AutocompleteInput({ value, options, type, onChange, onConfirm, onCancel, onTab }: AutocompleteInputProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightIdx, setHighlightIdx] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

    const filtered = options.filter(o => o.toLowerCase().includes(value.toLowerCase())).slice(0, 8);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
        else if (e.key === 'Tab') { e.preventDefault(); onConfirm(); onTab?.(e.shiftKey); }
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (showDropdown && highlightIdx >= 0 && filtered[highlightIdx]) {
                onChange(filtered[highlightIdx]);
            }
            onConfirm();
        }
        else if (e.key === 'ArrowDown' && showDropdown) { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, filtered.length - 1)); }
        else if (e.key === 'ArrowUp' && showDropdown) { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)); }
    };

    const inputType = type === 'date' ? 'date' : type === 'number' || type === 'currency' ? 'number' : 'text';

    return (
        <div className="relative" style={{ minWidth: 120 }}>
            <Input
                ref={inputRef}
                type={inputType}
                value={value}
                onChange={e => { onChange(e.target.value); setShowDropdown(true); setHighlightIdx(-1); }}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                onFocus={() => options.length > 0 && setShowDropdown(true)}
                className="h-7 text-xs border-primary"
                step={type === 'currency' ? '0.01' : undefined}
            />
            {showDropdown && filtered.length > 0 && (
                <div className="absolute z-50 mt-1 w-full max-h-40 overflow-auto rounded-md border border-border bg-popover shadow-lg animate-slide-down">
                    {filtered.map((opt, i) => (
                        <div
                            key={opt}
                            className={`px-3 py-1.5 text-xs cursor-pointer transition-colors ${i === highlightIdx ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                            onMouseDown={() => { onChange(opt); setShowDropdown(false); onConfirm(); }}
                            onMouseEnter={() => setHighlightIdx(i)}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
