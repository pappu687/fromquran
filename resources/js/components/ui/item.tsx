import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const itemVariants = cva(
    'flex gap-4 rounded-lg border p-4 transition-colors',
    {
        variants: {
            variant: {
                default: 'bg-card text-card-foreground',
                muted: 'bg-muted/50 text-muted-foreground border-muted',
                outline: 'bg-transparent border-border',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

const Item = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof itemVariants>
>(({ className, variant, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(itemVariants({ variant }), className)}
        {...props}
    />
));
Item.displayName = 'Item';

const itemMediaVariants = cva('flex items-center justify-center flex-shrink-0', {
    variants: {
        variant: {
            icon: 'h-10 w-10 rounded-lg bg-primary/10 text-primary',
            image: 'h-16 w-16 rounded-lg overflow-hidden',
        },
    },
    defaultVariants: {
        variant: 'icon',
    },
});

const ItemMedia = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> &
        VariantProps<typeof itemMediaVariants>
>(({ className, variant, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(itemMediaVariants({ variant }), className)}
        {...props}
    >
        {children}
    </div>
));
ItemMedia.displayName = 'ItemMedia';

const ItemContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('flex flex-col gap-1 min-w-0 flex-1', className)}
        {...props}
    />
));
ItemContent.displayName = 'ItemContent';

const ItemTitle = React.forwardRef<
    HTMLHeadingElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn('font-semibold leading-none tracking-tight', className)}
        {...props}
    />
));
ItemTitle.displayName = 'ItemTitle';

const ItemDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
    />
));
ItemDescription.displayName = 'ItemDescription';

export { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription };
