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
import { Minus, Plus } from 'lucide-react';
import { useLayoutEffect, useState } from 'react';

interface ReaderSettingsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Hardcoded translations for now - will be replaced with API data later
const AVAILABLE_TRANSLATIONS = [
    { id: 'sahih-international', name: 'Sahih International' },
    { id: 'dr-mustafa-khattab', name: 'Dr. Mustafa Khattab' },
    { id: 'pickthall', name: 'Pickthall' },
];

const MUSHAF_FONTS = [
    { id: 'uthmanic', name: 'Uthmanic Hafs' },
    { id: 'indopak', name: 'IndoPak' },
];

const MIN_FONT_SIZE = 1;
const MAX_FONT_SIZE = 3;
const FONT_SIZE_STEP = 0.2;

export function ReaderSettingsSheet({
    open,
    onOpenChange,
}: ReaderSettingsSheetProps) {
    const { settings, updateSettings } = useReaderSettings();

    // Local state for form - initialized from settings
    const [fontSize, setFontSize] = useState(settings.fontSize);
    const [selectedTranslations, setSelectedTranslations] = useState(
        settings.selectedTranslations,
    );
    const [showArabic, setShowArabic] = useState(settings.showArabic);
    const [mushafFont, setMushafFont] = useState(settings.mushafFont);
    const [showRecentlyViewed, setShowRecentlyViewed] = useState(settings.showRecentlyViewed);

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
        setFontSize((prev) => Math.min(prev + FONT_SIZE_STEP, MAX_FONT_SIZE));
    };

    const handleFontSizeDecrease = () => {
        setFontSize((prev) => Math.max(prev - FONT_SIZE_STEP, MIN_FONT_SIZE));
    };

    const handleTranslationToggle = (translationId: string) => {
        setSelectedTranslations((prev) => {
            if (prev.includes(translationId)) {
                return prev.filter((id) => id !== translationId);
            } else {
                return [...prev, translationId];
            }
        });
    };

    const handleSave = () => {
        updateSettings({
            fontSize,
            selectedTranslations,
            showArabic,
            mushafFont,
            showRecentlyViewed,
        });
        onOpenChange(false);
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
                                onCheckedChange={(checked) =>
                                    setShowArabic(checked as boolean)
                                }
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
                                            setMushafFont(
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
                                onCheckedChange={(checked) =>
                                    setShowRecentlyViewed(checked as boolean)
                                }
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
                        <Label>Translations</Label>
                        <div className="space-y-2">
                            {AVAILABLE_TRANSLATIONS.map((translation) => (
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
                                        className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {translation.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <SheetFooter className="mt-6">
                    <Button onClick={handleSave} className="w-full">
                        Save Settings
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
