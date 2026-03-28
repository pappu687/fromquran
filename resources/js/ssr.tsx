import { AuthProvider } from '@/contexts/auth-context';
import { makeQueryClient } from '@/lib/query-client';
import { type SharedData } from '@/types';
import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { QueryClientProvider } from '@tanstack/react-query';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';
import { ReaderSettingsProvider } from './contexts/reader-settings-context';
import { ReadingModeProvider } from './contexts/reading-mode-context';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => (title ? `${title} - ${appName}` : appName),
        resolve: (name) =>
            resolvePageComponent(
                `./pages/${name}.tsx`,
                import.meta.glob('./pages/**/*.tsx'),
            ),
        setup: ({ App, props }) => {
            const { auth } = props.initialPage.props as Partial<SharedData>;
            const user = auth?.user || null;
            const queryClient = makeQueryClient();

            return (
                <QueryClientProvider client={queryClient}>
                    <AuthProvider user={user}>
                        <ReaderSettingsProvider>
                            <ReadingModeProvider>
                                <App {...props} />
                            </ReadingModeProvider>
                        </ReaderSettingsProvider>
                    </AuthProvider>
                </QueryClientProvider>
            );
        },
    }),
);
