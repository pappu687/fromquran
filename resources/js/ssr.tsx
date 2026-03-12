import { AuthProvider } from '@/contexts/auth-context';
import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
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
            const { auth } = props.initialPage.props as {
                auth?: { user?: any };
            };
            const user = auth?.user || null;

            return (
                <AuthProvider user={user}>
                    <ReaderSettingsProvider>
                        <ReadingModeProvider>
                            <App {...props} />
                        </ReadingModeProvider>
                    </ReaderSettingsProvider>
                </AuthProvider>
            );
        },
    }),
);
