import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useReaderSettings } from '@/contexts/reader-settings-context';
import { Loader2, Minus, Plus } from 'lucide-react';
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
    { id: 'uthmanic', name: 'Uthmanic Hafs' },
    { id: 'indopak', name: 'IndoPak' },
] as const;

const MIN_FONT_SIZE = 1;
const MAX_FONT_SIZE = 3;
const FONT_SIZE_STEP = 0.2;

export function ReaderSettingsSheet({
    open,
    onOpenChange,
}: ReaderSettingsSheetProps) {
    const { settings, updateSettings } = useReaderSettings();
    const [availableTranslations, setAvailableTranslations] = useState<Translation[]>([]);
    const [loadingTranslations, setLoadingTranslations] = useState(false);

    // Local state for form - initialized from settings
    const [fontSize, setFontSize] = useState(settings.fontSize);
    const [selectedTranslations, setSelectedTranslations] = useState(
        settings.selectedTranslations,
    );
    const [showArabic, setShowArabic] = useState(settings.showArabic);
    const [mushafFont, setMushafFont] = useState(settings.mushafFont);
    const [showRecentlyViewed, setShowRecentlyViewed] = useState(settings.showRecentlyViewed);

    // Fetch translations from API
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

    // useLayoutEffect runs synchronously before paint, making it feel instant
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
        let newTranslations;
        if (selectedTranslations.includes(translationId)) {
            newTranslations = selectedTranslations.filter((id) => id !== translationId);
        } else {
            // Limit to maximum 2 translations
            if (selectedTranslations.length >= 2) {
                // Optionally replace the oldest one or just ignore
                // Let's replace the first one if we have 2
                newTranslations = [selectedTranslations[1], translationId];
            } else {
                newTranslations = [...selectedTranslations, translationId];
            }
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
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Reader Settings</SheetTitle>
                    <SheetDescription>
                        Customize your Quran reading experience
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6 p-5">
                    {/* Font Size Control */}
                    <div className="space-y-2">
                        <Label>Arabic Font Size</Label>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleFontSizeDecrease}
                                disabled={fontSize <= MIN_FONT_SIZE}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <div className="flex-1 text-center">
                                <span className="text-2xl font-semibold">
                                    {fontSize.toFixed(1)}
                                </span>
                                <span className="ml-1 text-sm text-muted-foreground">
                                    rem
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleFontSizeIncrease}
                                disabled={fontSize >= MAX_FONT_SIZE}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Range: {MIN_FONT_SIZE} - {MAX_FONT_SIZE} rem
                        </p>
                    </div>

                    {/* Show Arabic Toggle */}
                    <div className="space-y-2">
                        <Label>Display Arabic Text</Label>
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="show-arabic"
                                checked={showArabic}
                                onCheckedChange={handleArabicToggle}
                            />
                            <label
                                htmlFor="show-arabic"
                                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Show Arabic text
                            </label>
                        </div>
                    </div>

                    {/* Mushaf Font Selector */}
                    <div className="space-y-2">
                        <Label>Mushaf Font</Label>
                        <div className="space-y-2">
                            {MUSHAF_FONTS.map((font) => (
                                <div
                                    key={font.id}
                                    className="flex items-center gap-3"
                                >
                                    <Checkbox
                                        id={`mushaf-${font.id}`}
                                        checked={mushafFont === font.id}
                                        onCheckedChange={() =>
                                            handleMushafFontChange(
                                                font.id as
                                                    | 'uthmanic'
                                                    | 'indopak',
                                            )
                                        }
                                    />
                                    <label
                                        htmlFor={`mushaf-${font.id}`}
                                        className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {font.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Settings */}
                    <div className="space-y-2">
                        <Label>Navigation</Label>
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="show-recently-viewed"
                                checked={showRecentlyViewed}
                                onCheckedChange={handleRecentlyViewedToggle}
                            />
                            <label
                                htmlFor="show-recently-viewed"
                                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Show recently viewed surahs in sidebar
                            </label>
                        </div>
                    </div>

                    {/* Translations Selector */}
                    <div className="space-y-2">
                        <Label>Translations (Max 2)</Label>
                        <div className="max-h-[300px] space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                            {loadingTranslations && availableTranslations.length === 0 ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                availableTranslations.map((translation) => (
                                    <div
                                        key={translation.id}
                                        className="flex items-center gap-3"
                                    >
                                        <Checkbox
                                            id={`translation-${translation.id}`}
                                            checked={selectedTranslations.includes(
                                                translation.id,
                                            )}
                                            onCheckedChange={() =>
                                                handleTranslationToggle(
                                                    translation.id,
                                                )
                                            }
                                        />
                                        <label
                                            htmlFor={`translation-${translation.id}`}
                                            className="flex flex-col gap-0.5 text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            <span>{translation.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {translation.language}
                                            </span>
                                        </label>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
