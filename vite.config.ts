import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react-force-graph')) {
                            return 'vendor-force-graph';
                        }
                        if (id.includes('react-h5-audio-player')) {
                            return 'vendor-audio-player';
                        }
                        if (id.includes('@radix-ui')) {
                            return 'vendor-radix';
                        }
                        if (id.includes('react') || id.includes('react-dom')) {
                            return 'vendor-react';
                        }
                        if (id.includes('@inertiajs')) {
                            return 'vendor-inertia';
                        }
                        if (id.includes('@tanstack/react-query')) {
                            return 'vendor-react-query';
                        }
                        if (id.includes('@dnd-kit')) {
                            return 'vendor-dnd-kit';
                        }
                        if (id.includes('overlayscrollbars')) {
                            return 'vendor-overlayscrollbars';
                        }
                        if (id.includes('zustand')) {
                            return 'vendor-zustand';
                        }
                        if (id.includes('lucide-react')) {
                            return 'vendor-lucide';
                        }
                        if (id.includes('cmdk')) {
                            return 'vendor-cmdk';
                        }
                        return 'vendor';
                    }
                },
            },
        },
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./resources/js/test/setup.ts'],
    },
});
