import { useStorage } from '@/hooks/use-storage';
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
} from 'react';

export interface ReaderSettings {
    fontSize: number; // in rem, default 2.1
    selectedTranslations: number[]; // default none selected
    showArabic: boolean; // default true
    showTajweed: boolean; // default false
    mushafFont: 'uthmanic' | 'indopak'; // default 'uthmanic'
    showRecentlyViewed: boolean; // default false
}

interface ReaderSettingsContextType {
    settings: ReaderSettings;
    updateSettings: (newSettings: Partial<ReaderSettings>) => void;
    resetSettings: () => void;
}

const DEFAULT_SETTINGS: ReaderSettings = {
    fontSize: 2.1,
    selectedTranslations: [],
    showArabic: true,
    showTajweed: false,
    mushafFont: 'uthmanic',
    showRecentlyViewed: false,
};

const ReaderSettingsContext = createContext<
    ReaderSettingsContextType | undefined
>(undefined);

export function ReaderSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useStorage<ReaderSettings>({
        key: 'quran-reader-settings',
        defaultValue: DEFAULT_SETTINGS,
    });

    const updateSettings = useCallback(
        (newSettings: Partial<ReaderSettings>) => {
            setSettings((prev) => ({ ...prev, ...newSettings }));
        },
        [setSettings],
    );

    const resetSettings = useCallback(() => {
        setSettings(DEFAULT_SETTINGS);
    }, [setSettings]);

    const contextValue = React.useMemo(
        () => ({
            settings,
            updateSettings,
            resetSettings,
        }),
        [settings, updateSettings, resetSettings],
    );

    return (
        <ReaderSettingsContext.Provider value={contextValue}>
            {children}
        </ReaderSettingsContext.Provider>
    );
}

export function useReaderSettings() {
    const context = useContext(ReaderSettingsContext);
    if (context === undefined) {
        throw new Error(
            'useReaderSettings must be used within a ReaderSettingsProvider',
        );
    }
    return context;
}
