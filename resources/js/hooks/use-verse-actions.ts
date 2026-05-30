import { type VerseListItem } from '@/types/quran';
import { useCallback, useState } from 'react';

interface UseVerseActionsOptions {
    verse: VerseListItem;
    totalVerses?: number;
    isBookmarked?: boolean;
    hasResources?: boolean;
    resourceCount?: number;
    onBookmarkToggle?: (verseId: number) => void;
    onCopy?: (verseId: number, text: string) => void;
}

export function useVerseActions({
    verse,
    totalVerses,
    isBookmarked = false,
    hasResources = false,
    resourceCount = 0,
    onBookmarkToggle,
    onCopy,
}: UseVerseActionsOptions) {
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [isResourcesSheetOpen, setIsResourcesSheetOpen] = useState(false);
    const [activeResourceSection, setActiveResourceSection] = useState<
        string | undefined
    >(undefined);
    const [isGraphV2ModalOpen, setIsGraphV2ModalOpen] = useState(false);
    const [isCollectionsModalOpen, setIsCollectionsModalOpen] = useState(false);
    const [isTafsirModalOpen, setIsTafsirModalOpen] = useState(false);

    const handleBookmark = useCallback(() => {
        onBookmarkToggle?.(verse.id);
    }, [onBookmarkToggle, verse.id]);

    const handleCopyArabic = useCallback(() => {
        navigator.clipboard.writeText(verse.text);
        onCopy?.(verse.id, verse.text);
    }, [verse.text, verse.id, onCopy]);

    const handleCopyTranslation = useCallback(() => {
        const firstTranslation = verse.translations?.[0]?.text;
        if (firstTranslation) {
            navigator.clipboard.writeText(firstTranslation);
            onCopy?.(verse.id, firstTranslation);
        }
    }, [verse.translations, verse.id, onCopy]);

    const buildVerseUrl = useCallback(() => {
        if (typeof window === 'undefined') return '';
        return `${window.location.origin}/${verse.chapterNumber}/${verse.verseNumber}`;
    }, [verse.chapterNumber, verse.verseNumber]);

    const handleCopyLink = useCallback(() => {
        const url = buildVerseUrl();
        if (!url) return;
        navigator.clipboard.writeText(url);
    }, [buildVerseUrl]);

    const verseLabel = verse.chapterNumber
        ? `Quran ${verse.chapterNumber}:${verse.verseNumber}`
        : `Verse ${verse.verseNumber}`;

    const openShareWindow = useCallback((href: string) => {
        window.open(href, '_blank', 'noopener,noreferrer');
    }, []);

    const buildShareUrl = useCallback(() => {
        const url = buildVerseUrl();
        if (!url) return null;
        return encodeURIComponent(url);
    }, [buildVerseUrl]);

    const handleShareToFacebook = useCallback(() => {
        const encodedUrl = buildShareUrl();
        if (!encodedUrl) return;
        openShareWindow(
            `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        );
    }, [buildShareUrl, openShareWindow]);

    const handleShareToTwitter = useCallback(() => {
        const encodedUrl = buildShareUrl();
        if (!encodedUrl) return;
        const encodedText = encodeURIComponent(verseLabel);
        openShareWindow(
            `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
        );
    }, [buildShareUrl, openShareWindow, verseLabel]);

    const handleAddResource = useCallback(() => {
        setIsResourceModalOpen(true);
    }, []);

    const resourcesTooltip =
        resourceCount > 0
            ? `View (${resourceCount}) Resources`
            : 'View Resources';

    return {
        isResourceModalOpen,
        isResourcesSheetOpen,
        activeResourceSection,
        isGraphV2ModalOpen,
        isCollectionsModalOpen,
        isTafsirModalOpen,
        setIsResourceModalOpen,
        setIsResourcesSheetOpen,
        setActiveResourceSection,
        setIsGraphV2ModalOpen,
        setIsCollectionsModalOpen,
        setIsTafsirModalOpen,
        handleBookmark,
        handleCopyArabic,
        handleCopyTranslation,
        handleCopyLink,
        handleShareToFacebook,
        handleShareToTwitter,
        handleAddResource,
        verseLabel,
        resourcesTooltip,
        isBookmarked,
        hasResources,
        resourceCount,
        totalVerses,
    };
}

export type UseVerseActionsReturn = ReturnType<typeof useVerseActions>;
