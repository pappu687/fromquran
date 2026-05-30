import { type UseVerseActionsReturn } from '@/hooks/use-verse-actions';
import { type VerseListItem } from '@/types/quran';
import { AddResourceModal } from './add-resource-modal';
import { CollectionsModal } from './collections-modal';
import { QuranGraphV2Modal } from './quran-graph-v2-modal';
import { ResourcesSheet } from './resources-sheet';
import { TafsirModal } from './tafsir-modal';

interface VerseActionsModalsProps {
    actions: UseVerseActionsReturn;
    verse: VerseListItem;
}

export function VerseActionsModals({
    actions,
    verse,
}: VerseActionsModalsProps) {
    return (
        <>
            <AddResourceModal
                open={actions.isResourceModalOpen}
                onOpenChange={actions.setIsResourceModalOpen}
                verseId={verse.id}
            />
            <CollectionsModal
                open={actions.isCollectionsModalOpen}
                onOpenChange={actions.setIsCollectionsModalOpen}
                verseId={verse.id}
                chapterId={verse.chapterId}
                verseNumber={verse.verseNumber}
                totalVerses={actions.totalVerses}
            />
            <ResourcesSheet
                open={actions.isResourcesSheetOpen}
                onOpenChange={actions.setIsResourcesSheetOpen}
                verseId={verse.id}
                verseNumber={verse.verseNumber}
                chapterNumber={verse.chapterNumber}
                initialActiveSection={actions.activeResourceSection}
            />
            <QuranGraphV2Modal
                open={actions.isGraphV2ModalOpen}
                onOpenChange={actions.setIsGraphV2ModalOpen}
                verseId={verse.id}
                verseKey={`${verse.chapterNumber}:${verse.verseNumber}`}
            />
            <TafsirModal
                open={actions.isTafsirModalOpen}
                onOpenChange={actions.setIsTafsirModalOpen}
                chapterId={verse.chapterId}
                verseNumber={verse.verseNumber}
                chapterNumber={verse.chapterNumber}
                totalVerses={actions.totalVerses}
            />
        </>
    );
}
