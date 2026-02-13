import * as React from 'react';

import { cn } from '@/lib/utils';

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ButtonGroup({ className, ...props }: ButtonGroupProps) {
    return (
        <div
            data-slot="button-group"
            className={cn('inline-flex items-stretch', className)}
            {...props}
        />
    );
}

