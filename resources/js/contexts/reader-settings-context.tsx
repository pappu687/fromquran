import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ReaderSettings {
    fontSize: number; // in rem, default 1.5
    selectedTranslations: string[]; // default ['Sahih International']
    showArabic: boolean; // default true
    mushafFont: 'uthmanic' | 'indopak'; // default 'uthmanic'
    showRecentlyViewed: boolean; // default false
}

interface ReaderSettingsContextType {
    settings: ReaderSettings;
    updateSettings: (newSettings: Partial<ReaderSettings>) => void;
    resetSettings: () => void;
}

const DEFAULT_SETTINGS: ReaderSettings = {
    fontSize: 1.5,
    selectedTranslations: ['Sahih International'],
    showArabic: true,
    mushafFont: 'uthmanic',
    showRecentlyViewed: false,
};

const STORAGE_KEY = 'quran-reader-settings';

const ReaderSettingsContext = createContext<ReaderSettingsContextType | undefined>(undefined);

export function ReaderSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);

    // Load settings from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsedSettings = JSON.parse(stored);
                setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
            }
        } catch (error) {
            console.error('Failed to load reader settings:', error);
        }
    }, []);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save reader settings:', error);
        }
    }, [settings]);

    const updateSettings = (newSettings: Partial<ReaderSettings>) => {
        setSettings((prev) => ({ ...prev, ...newSettings }));
    };

    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
    };

    return (
        <ReaderSettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
            {children}
        </ReaderSettingsContext.Provider>
    );
}

export function useReaderSettings() {
    const context = useContext(ReaderSettingsContext);
    if (context === undefined) {
        throw new Error('useReaderSettings must be used within a ReaderSettingsProvider');
    }
    return context;
}
