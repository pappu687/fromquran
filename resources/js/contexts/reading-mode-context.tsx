'use client';

import { useStorage } from '@/hooks/use-storage';
import * as React from 'react';

type ReadingMode = 'list' | 'reading';

interface ReadingModeContextType {
    mode: ReadingMode;
    setMode: (mode: ReadingMode) => void;
}

const ReadingModeContext = React.createContext<
    ReadingModeContextType | undefined
>(undefined);

export function ReadingModeProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mode, setMode] = useStorage<ReadingMode>({
        key: 'reading-mode',
        defaultValue: 'list',
    });

    const contextValue = React.useMemo(
        () => ({ mode, setMode }),
        [mode, setMode],
    );

    return (
        <ReadingModeContext.Provider value={contextValue}>
            {children}
        </ReadingModeContext.Provider>
    );
}

export function useReadingMode() {
    const context = React.useContext(ReadingModeContext);
    if (context === undefined) {
        throw new Error(
            'useReadingMode must be used within a ReadingModeProvider',
        );
    }
    return context;
}
