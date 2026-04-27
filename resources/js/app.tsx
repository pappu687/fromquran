import 'overlayscrollbars/overlayscrollbars.css';
import '../css/app.css';

import { QuranFloatingAudioPlayer } from '@/components/audio/QuranFloatingAudioPlayer';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/auth-context';
import { QueryProvider } from '@/providers/query-provider';
import { type SharedData } from '@/types';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { ReaderSettingsProvider } from './contexts/reader-settings-context';
import { ReadingModeProvider } from './contexts/reading-mode-context';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const { auth } = props.initialPage.props as Partial<SharedData>;
        const user = auth?.user || null;

        const content = (
            <StrictMode>
                <QueryProvider>
                    <AuthProvider user={user}>
                        <ReaderSettingsProvider>
                            <ReadingModeProvider>
                                <App {...props} />
                                <QuranFloatingAudioPlayer />
                                <Toaster />
                            </ReadingModeProvider>
                        </ReaderSettingsProvider>
                    </AuthProvider>
                </QueryProvider>
            </StrictMode>
        );

        if (el.hasChildNodes()) {
            try {
                hydrateRoot(el, content);
            } catch (error) {
                if (import.meta.env.DEV) {
                    // In development, rethrow so React's full error is visible
                    console.error(error);
                    throw error;
                }

                // In production, fall back to a client-only render if hydration fails
                console.error(
                    'Hydration failed; falling back to client render.',
                    error,
                );
                el.innerHTML = '';
                createRoot(el).render(content);
            }
        } else {
            createRoot(el).render(content);
        }
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
