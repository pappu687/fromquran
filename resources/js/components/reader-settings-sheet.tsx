import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useReaderSettings } from '@/contexts/reader-settings-context';
import { cn } from '@/lib/utils';
import {
    Check,
    Languages,
    Loader2,
    Minus,
    PanelsTopLeft,
    Plus,
    Type,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useState } from 'react';

interface ReaderSettingsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface Translation {
    id: number;
    name: string;
    language: string;
}

const MUSHAF_FONTS = [
    { id: 'uthmanic', name: 'Uthmanic Hafs', description: 'Classic script' },
    { id: 'indopak', name: 'IndoPak', description: 'South Asian layout' },
] as const;

const MIN_FONT_SIZE = 1;
const MAX_FONT_SIZE = 3;
const FONT_SIZE_STEP = 0.2;

interface SectionProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
}

function SettingsSection({ icon, title, description, children }: SectionProps) {
    return (
        <section className="border-b border-slate-200 pb-5 last:border-b-0 last:pb-0">
            <div className="mb-4 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-slate-700">
                    {icon}
                </div>
                <div>
                    <h3 className="text-base font-semibold tracking-tight text-slate-950">
                        {title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                        {description}
                    </p>
                </div>
            </div>
            {children}
        </section>
    );
}

interface ToggleRowProps {
    id: string;
    label: string;
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}

function ToggleRow({
    id,
    label,
    description,
    checked,
    onCheckedChange,
}: ToggleRowProps) {
    return (
        <label
            htmlFor={id}
            className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl px-1 py-2 transition-colors"
        >
            <div className="min-w-0">
                <div className="text-sm font-medium text-slate-950">
                    {label}
                </div>
                <div className="mt-1 text-sm leading-6 text-slate-500">
                    {description}
                </div>
            </div>
            <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={onCheckedChange}
                className="mt-0.5"
            />
        </label>
    );
}

export function ReaderSettingsSheet({
    open,
    onOpenChange,
}: ReaderSettingsSheetProps) {
    const { settings, updateSettings } = useReaderSettings();
    const [availableTranslations, setAvailableTranslations] = useState<
        Translation[]
    >([]);
    const [loadingTranslations, setLoadingTranslations] = useState(false);

    const [fontSize, setFontSize] = useState(settings.fontSize);
    const [selectedTranslations, setSelectedTranslations] = useState(
        settings.selectedTranslations,
    );
    const [showArabic, setShowArabic] = useState(settings.showArabic);
    const [mushafFont, setMushafFont] = useState(settings.mushafFont);
    const [showRecentlyViewed, setShowRecentlyViewed] = useState(
        settings.showRecentlyViewed,
    );

    useEffect(() => {
        if (open && availableTranslations.length === 0) {
            const fetchSettings = async () => {
                setLoadingTranslations(true);
                try {
                    const response = await fetch('/api/quran/settings');
                    const data = await response.json();
                    if (data.translations_list) {
                        setAvailableTranslations(data.translations_list);
                    }
                } catch (error) {
                    console.error('Failed to fetch translations:', error);
                } finally {
                    setLoadingTranslations(false);
                }
            };
            fetchSettings();
        }
    }, [open, availableTranslations.length]);

    useLayoutEffect(() => {
        if (open) {
            setFontSize(settings.fontSize);
            setSelectedTranslations(settings.selectedTranslations);
            setShowArabic(settings.showArabic);
            setMushafFont(settings.mushafFont);
            setShowRecentlyViewed(settings.showRecentlyViewed);
        }
    }, [open, settings]);

    const handleFontSizeIncrease = () => {
        const newSize = Math.min(fontSize + FONT_SIZE_STEP, MAX_FONT_SIZE);
        setFontSize(newSize);
        updateSettings({ fontSize: newSize });
    };

    const handleFontSizeDecrease = () => {
        const newSize = Math.max(fontSize - FONT_SIZE_STEP, MIN_FONT_SIZE);
        setFontSize(newSize);
        updateSettings({ fontSize: newSize });
    };

    const handleTranslationToggle = (translationId: number) => {
        let newTranslations: number[];

        if (selectedTranslations.includes(translationId)) {
            newTranslations = selectedTranslations.filter(
                (id) => id !== translationId,
            );
        } else if (selectedTranslations.length >= 2) {
            newTranslations = [selectedTranslations[1], translationId];
        } else {
            newTranslations = [...selectedTranslations, translationId];
        }

        setSelectedTranslations(newTranslations);
        updateSettings({ selectedTranslations: newTranslations });
    };

    const handleArabicToggle = (checked: boolean) => {
        setShowArabic(checked);
        updateSettings({ showArabic: checked });
    };

    const handleMushafFontChange = (fontId: 'uthmanic' | 'indopak') => {
        setMushafFont(fontId);
        updateSettings({ mushafFont: fontId });
    };

    const handleRecentlyViewedToggle = (checked: boolean) => {
        setShowRecentlyViewed(checked);
        updateSettings({ showRecentlyViewed: checked });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full max-w-xs border-l border-slate-200 bg-[#f7f7f3] sm:max-w-[540px]">
                <SheetHeader className="border-b border-slate-200 px-5 py-5 sm:px-6">
                    <SheetTitle className="text-xl tracking-tight text-slate-950">
                        Reader Settings
                    </SheetTitle>
                    <SheetDescription className="max-w-md leading-6 text-slate-500">
                        Adjust the reading view, script style, and translation
                        setup without leaving the page.
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                    <SettingsSection
                        icon={<Type className="h-4 w-4" />}
                        title="Reading View"
                        description="Control the script visibility and Arabic text size."
                    >
                        <div className="space-y-3">
                            <div className="px-1 py-1">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <Label className="text-sm font-medium text-slate-950">
                                            Arabic font size
                                        </Label>
                                        <p className="mt-1 text-sm leading-6 text-slate-500">
                                            Increase or reduce the Quran text
                                            size for more comfortable reading.
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-semibold tracking-tight text-slate-950">
                                            {fontSize.toFixed(1)}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            rem
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleFontSizeDecrease}
                                        disabled={fontSize <= MIN_FONT_SIZE}
                                        className="rounded-full border-slate-200 bg-white shadow-none"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200">
                                        <div
                                            className="h-full rounded-full bg-slate-900 transition-all"
                                            style={{
                                                width: `${((fontSize - MIN_FONT_SIZE) / (MAX_FONT_SIZE - MIN_FONT_SIZE)) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleFontSizeIncrease}
                                        disabled={fontSize >= MAX_FONT_SIZE}
                                        className="rounded-full border-slate-200 bg-white shadow-none"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <ToggleRow
                                id="show-arabic"
                                label="Display Arabic text"
                                description="Keep the original Arabic visible alongside translations."
                                checked={showArabic}
                                onCheckedChange={handleArabicToggle}
                            />
                        </div>
                    </SettingsSection>

                    <SettingsSection
                        icon={<PanelsTopLeft className="h-4 w-4" />}
                        title="Layout"
                        description="Adjust navigation behavior and default script style."
                    >
                        <div className="space-y-3">
                            <div className="space-y-2 px-1">
                                <Label className="text-sm font-medium text-slate-950">
                                    Mushaf font
                                </Label>
                                <div className="grid gap-2">
                                    {MUSHAF_FONTS.map((font) => {
                                        const isSelected =
                                            mushafFont === font.id;

                                        return (
                                            <button
                                                key={font.id}
                                                type="button"
                                                onClick={() =>
                                                    handleMushafFontChange(
                                                        font.id,
                                                    )
                                                }
                                                className={cn(
                                                    'flex items-center justify-between rounded-2xl px-3 py-3 text-left transition-colors',
                                                    isSelected
                                                        ? 'bg-white ring-1 ring-slate-900'
                                                        : 'hover:bg-white/80',
                                                )}
                                            >
                                                <div>
                                                    <div className="text-sm font-medium text-slate-950">
                                                        {font.name}
                                                    </div>
                                                    <div className="mt-1 text-sm text-slate-500">
                                                        {font.description}
                                                    </div>
                                                </div>
                                                <div
                                                    className={cn(
                                                        'flex h-6 w-6 items-center justify-center rounded-full border',
                                                        isSelected
                                                            ? 'border-slate-900 bg-slate-900 text-white'
                                                            : 'border-slate-300 bg-white text-transparent',
                                                    )}
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <ToggleRow
                                id="show-recently-viewed"
                                label="Show recently viewed surahs"
                                description="Keep recently opened chapters visible in the sidebar for quicker return."
                                checked={showRecentlyViewed}
                                onCheckedChange={handleRecentlyViewedToggle}
                            />
                        </div>
                    </SettingsSection>

                    <SettingsSection
                        icon={<Languages className="h-4 w-4" />}
                        title="Translations"
                        description="Choose up to two translations to appear with the Arabic text."
                    >
                        <div>
                            <div className="mb-3 flex items-center justify-between gap-3 px-1">
                                <p className="text-sm text-slate-500">
                                    Selected {selectedTranslations.length} of 2
                                </p>
                                <p className="text-xs text-slate-400">
                                    New picks replace the oldest selection
                                </p>
                            </div>

                            <div className="max-h-[320px] space-y-1.5 overflow-y-auto px-1 py-1">
                                {loadingTranslations &&
                                availableTranslations.length === 0 ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                                    </div>
                                ) : (
                                    availableTranslations.map((translation) => {
                                        const isSelected =
                                            selectedTranslations.includes(
                                                translation.id,
                                            );

                                        return (
                                            <label
                                                key={translation.id}
                                                htmlFor={`translation-${translation.id}`}
                                                className={cn(
                                                    'flex cursor-pointer items-start justify-between gap-4 rounded-2xl px-3 py-3 transition-colors',
                                                    isSelected
                                                        ? 'bg-white ring-1 ring-slate-900'
                                                        : 'border border-transparent hover:bg-white/80',
                                                )}
                                            >
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-slate-950">
                                                        {translation.name}
                                                    </div>
                                                    <div className="mt-1 text-sm text-slate-500">
                                                        {translation.language}
                                                    </div>
                                                </div>
                                                <Checkbox
                                                    id={`translation-${translation.id}`}
                                                    checked={isSelected}
                                                    onCheckedChange={() =>
                                                        handleTranslationToggle(
                                                            translation.id,
                                                        )
                                                    }
                                                    className="mt-0.5"
                                                />
                                            </label>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </SettingsSection>
                </div>
            </SheetContent>
        </Sheet>
    );
}
