import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { type CollectionTag } from '@/types/collections';
import { Link } from '@inertiajs/react';

interface CollectionTagListProps {
    tags: CollectionTag[];
    className?: string;
    getHref?: (tag: CollectionTag) => string;
}

export function CollectionTagList({
    tags,
    className,
    getHref,
}: CollectionTagListProps) {
    if (tags.length === 0) {
        return null;
    }

    return (
        <div className={cn('flex flex-wrap gap-2', className)}>
            {tags.map((tag) => {
                const href = getHref?.(tag);

                if (href) {
                    return (
                        <Link
                            key={`${tag.type}-${tag.slug}`}
                            href={href}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                        >
                            {tag.name}
                        </Link>
                    );
                }

                return (
                    <Badge
                        key={`${tag.type}-${tag.slug}`}
                        variant="secondary"
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600"
                    >
                        {tag.name}
                    </Badge>
                );
            })}
        </div>
    );
}
