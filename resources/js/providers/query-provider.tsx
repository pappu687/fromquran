import { getBrowserQueryClient } from '@/lib/query-client';
import { QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren } from 'react';

export function QueryProvider({ children }: PropsWithChildren) {
    return (
        <QueryClientProvider client={getBrowserQueryClient()}>
            {children}
        </QueryClientProvider>
    );
}
