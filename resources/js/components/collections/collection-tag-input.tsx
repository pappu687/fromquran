import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { type CollectionTag } from '@/types/collections';
import { Plus, X } from 'lucide-react';
import { KeyboardEvent, useMemo, useState } from 'react';

const TAG_TYPES = [
    'theme',
    'topic',
    'emotion',
    'virtue',
    'vice',
    'law',
    'general',
] as const;

interface CollectionTagInputProps {
    value: CollectionTag[];
    onChange: (tags: CollectionTag[]) => void;
    availableTags?: CollectionTag[];
    disabled?: boolean;
    label?: string;
    description?: string;
}

function normalizeTag(tag: Pick<CollectionTag, 'name' | 'type'>): CollectionTag {
    const normalizedName = tag.name.trim().replace(/\s+/g, ' ');
    const normalizedType = tag.type.trim().toLowerCase() || 'general';

    return {
        name: normalizedName,
        type: normalizedType,
        slug: normalizedName
            .toLowerCase()
            .replace(/['’]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''),
    };
}

export function CollectionTagInput({
    value,
    onChange,
    availableTags = [],
    disabled = false,
    label = 'Tags',
    description,
}: CollectionTagInputProps) {
    const [draftName, setDraftName] = useState('');
    const [draftType, setDraftType] = useState<string>('theme');

    const selectedKeys = useMemo(
        () => new Set(value.map((tag) => `${tag.type}:${tag.slug}`)),
        [value],
    );

    const suggestions = useMemo(() => {
        const query = draftName.trim().toLowerCase();

        return availableTags
            .filter((tag) => !selectedKeys.has(`${tag.type}:${tag.slug}`))
            .filter((tag) => {
                if (!query) {
                    return tag.type === draftType;
                }

                return (
                    tag.name.toLowerCase().includes(query) ||
                    tag.slug.toLowerCase().includes(query)
                );
            })
            .slice(0, 6);
    }, [availableTags, draftName, draftType, selectedKeys]);

    const addTag = (tag: Pick<CollectionTag, 'name' | 'type'>) => {
        const normalizedTag = normalizeTag(tag);

        if (!normalizedTag.name || !normalizedTag.slug) {
            return;
        }

        if (selectedKeys.has(`${normalizedTag.type}:${normalizedTag.slug}`)) {
            setDraftName('');
            return;
        }

        const existingTag = availableTags.find(
            (availableTag) =>
                availableTag.slug === normalizedTag.slug &&
                availableTag.type === normalizedTag.type,
        );

        onChange([
            ...value,
            existingTag
                ? {
                      ...normalizedTag,
                      id: existingTag.id,
                      color: existingTag.color,
                      status: existingTag.status,
                  }
                : normalizedTag,
        ]);
        setDraftName('');
    };

    const removeTag = (tagToRemove: CollectionTag) => {
        onChange(
            value.filter(
                (tag) =>
                    !(
                        tag.slug === tagToRemove.slug &&
                        tag.type === tagToRemove.type
                    ),
            ),
        );
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'Enter' && event.key !== ',') {
            return;
        }

        event.preventDefault();
        addTag({ name: draftName, type: draftType });
    };

    return (
        <div className="space-y-3">
            <div>
                <Label>{label}</Label>
                {description ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                    value={draftType}
                    onValueChange={setDraftType}
                    disabled={disabled}
                >
                    <SelectTrigger className="sm:w-40">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        {TAG_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                                {type}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex flex-1 gap-2">
                    <Input
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Add a tag like Patience"
                        disabled={disabled}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => addTag({ name: draftName, type: draftType })}
                        disabled={disabled || draftName.trim().length === 0}
                    >
                        <Plus className="h-4 w-4" />
                        Add
                    </Button>
                </div>
            </div>

            {suggestions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {suggestions.map((tag) => (
                        <button
                            key={`${tag.type}:${tag.slug}`}
                            type="button"
                            onClick={() =>
                                addTag({
                                    name: tag.name,
                                    type: tag.type,
                                })
                            }
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-950"
                            disabled={disabled}
                        >
                            {tag.name}
                            <span className="ml-1 text-slate-400">
                                {tag.type}
                            </span>
                        </button>
                    ))}
                </div>
            ) : null}

            <div className={cn('flex flex-wrap gap-2', value.length === 0 && 'hidden')}>
                {value.map((tag) => (
                    <Badge
                        key={`${tag.type}:${tag.slug}`}
                        variant="secondary"
                        className="gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700"
                    >
                        <span>{tag.name}</span>
                        <span className="text-[10px] uppercase text-slate-400">
                            {tag.type}
                        </span>
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="rounded-full text-slate-400 transition-colors hover:text-slate-700"
                            disabled={disabled}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>
        </div>
    );
}
