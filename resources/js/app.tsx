import 'overlayscrollbars/overlayscrollbars.css';
import '../css/app.css';

import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/auth-context';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
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
        const root = createRoot(el);

        const { auth } = props.initialPage.props as { auth?: { user?: any } };
        const user = auth?.user || null;

        root.render(
            <StrictMode>
                <AuthProvider user={user}>
                    <ReaderSettingsProvider>
                        <ReadingModeProvider>
                            <App {...props} />
                            <Toaster />
                        </ReadingModeProvider>
                    </ReaderSettingsProvider>
                </AuthProvider>
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
