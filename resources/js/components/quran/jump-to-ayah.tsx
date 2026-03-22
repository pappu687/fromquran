import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Crosshair, X } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';

interface JumpToAyahProps {
    totalAyahs: number;
    currentAyah: number;
    onJump: (ayahNumber: number) => Promise<boolean>;
}

export function JumpToAyah({
    totalAyahs,
    currentAyah,
    onJump,
}: JumpToAyahProps) {
    const isMobile = useIsMobile();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }, 60);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [open]);

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            setQuery(String(currentAyah));
        } else {
            setValidationError(null);
        }

        setOpen(nextOpen);
    };

    const gridAyahs = useMemo(
        () => Array.from({ length: totalAyahs }, (_, index) => index + 1),
        [totalAyahs],
    );

    const validateAyah = (value: number) => {
        if (!Number.isInteger(value) || value < 1 || value > totalAyahs) {
            return `Enter a number between 1 and ${totalAyahs}`;
        }

        return null;
    };

    const submitAyah = async (ayahNumber: number) => {
        const error = validateAyah(ayahNumber);

        if (error) {
            setValidationError(error);
            return;
        }

        setValidationError(null);

        const jumped = await onJump(ayahNumber);

        if (jumped) {
            handleOpenChange(false);
            return;
        }

        setValidationError('Could not jump to that ayah right now.');
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        await submitAyah(Number.parseInt(query, 10));
    };

    const triggerButton = (
        <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full text-slate-500 hover:bg-stone-200/80 hover:text-slate-900"
            aria-label="Jump to ayah"
        >
            <Crosshair className="h-4 w-4" />
        </Button>
    );

    const panel = (
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,244,238,0.96)_100%)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-5 py-4">
                <div>
                    <h2 className="text-base font-semibold tracking-tight text-slate-900">
                        Jump to Ayah
                    </h2>
                    <p className="mt-1 text-xs tracking-[0.18em] text-slate-500 uppercase">
                        Current: Ayah {currentAyah}
                    </p>
                </div>
                {!isMobile && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-full text-slate-500 hover:bg-stone-200/70 hover:text-slate-900"
                        onClick={() => handleOpenChange(false)}
                        aria-label="Close jump to ayah"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3 pb-1">
                        <label
                            htmlFor="jump-to-ayah-input"
                            className="mb-2 block text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase"
                        >
                            Ayah number
                        </label>
                        <div className="flex items-start gap-2">
                            <Input
                                id="jump-to-ayah-input"
                                ref={inputRef}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={query}
                                onChange={(event) => {
                                    setQuery(
                                        event.target.value.replace(/[^\d]/g, ''),
                                    );
                                    if (validationError) {
                                        setValidationError(null);
                                    }
                                }}
                                className="h-11 rounded-2xl border-slate-200 bg-stone-50 text-base shadow-none focus-visible:ring-slate-900"
                                aria-describedby="jump-to-ayah-error"
                            />
                            <Button
                                type="submit"
                                className="h-11 rounded-2xl bg-slate-900 px-4 text-sm text-white hover:bg-slate-800"
                            >
                                Go
                            </Button>
                        </div>
                        <InputError
                            id="jump-to-ayah-error"
                            role="alert"
                            aria-live="polite"
                            message={validationError ?? undefined}
                            className="mt-2"
                        />
                    </div>

                    <div className="space-y-3 border-t border-slate-200/70 pt-4">
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                Quick jump
                            </p>
                            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                {totalAyahs} ayahs
                            </span>
                        </div>
                        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                            {gridAyahs.map((ayahNumber) => {
                                const isCurrent = ayahNumber === currentAyah;

                                return (
                                    <Button
                                        key={ayahNumber}
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            'h-11 rounded-2xl border border-transparent bg-stone-50 text-sm font-medium text-slate-700 hover:bg-stone-200/80',
                                            isCurrent &&
                                                'border-amber-200 bg-amber-100 text-amber-900',
                                        )}
                                        onClick={() =>
                                            void submitAyah(ayahNumber)
                                        }
                                        aria-label={
                                            isCurrent
                                                ? `Ayah ${ayahNumber}, current`
                                                : `Ayah ${ayahNumber}`
                                        }
                                    >
                                        {ayahNumber}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={handleOpenChange}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <SheetTrigger asChild>{triggerButton}</SheetTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Jump to Ayah</TooltipContent>
                </Tooltip>
                <SheetContent
                    side="bottom"
                    className="h-[70vh] min-h-0 rounded-t-[28px] border-t border-slate-200 bg-transparent p-0"
                >
                    <SheetHeader className="sr-only">
                        <SheetTitle>Jump to Ayah</SheetTitle>
                    </SheetHeader>
                    {panel}
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Jump to Ayah</TooltipContent>
            </Tooltip>
            <PopoverContent
                align="end"
                side="bottom"
                sideOffset={10}
                className="flex h-[70vh] w-[min(92vw,380px)] max-h-[70vh] flex-col overflow-hidden rounded-[28px] border-slate-200 bg-transparent p-0 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)]"
            >
                {panel}
            </PopoverContent>
        </Popover>
    );
}
