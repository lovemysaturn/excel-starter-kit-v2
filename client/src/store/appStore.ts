import { create } from 'zustand';

interface AppState {
    language: 'en' | 'hi';
    theme: 'light' | 'dark';
    currentPage: string;
    statusBar: {
        totalRecords: number;
        selectedCount: number;
        lastSaved: string;
        sumAmount: number;
    };
    settings: Record<string, string>;

    // Actions
    setLanguage: (lang: 'en' | 'hi') => void;
    toggleLanguage: () => void;
    setTheme: (theme: 'light' | 'dark') => void;
    toggleTheme: () => void;
    setCurrentPage: (page: string) => void;
    updateStatusBar: (data: Partial<AppState['statusBar']>) => void;
    updateSettings: (settings: Record<string, string>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    language: 'en',
    theme: 'light',
    currentPage: '/',
    statusBar: { totalRecords: 0, selectedCount: 0, lastSaved: '', sumAmount: 0 },
    settings: {},

    setLanguage: (lang) => set({ language: lang }),
    toggleLanguage: () => set(s => ({ language: s.language === 'en' ? 'hi' : 'en' })),
    setTheme: (theme) => {
        set({ theme });
        document.documentElement.classList.toggle('dark', theme === 'dark');
    },
    toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: next });
        document.documentElement.classList.toggle('dark', next === 'dark');
    },
    setCurrentPage: (page) => set({ currentPage: page }),
    updateStatusBar: (data) => set(s => ({ statusBar: { ...s.statusBar, ...data } })),
    updateSettings: (settings) => set({ settings }),
}));

// ─── Helper: bilingual label ───
export function useLabel() {
    const language = useAppStore(s => s.language);
    return (en: string, hi: string) => language === 'hi' ? hi : en;
}
