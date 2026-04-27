import { api } from '@/lib/api-client';

export interface VerseNavigationItem {
    verse_key: string;
    chapter_id: number;
    verse_number: number;
}

export interface VerseNavigationResponse {
    current: VerseNavigationItem;
    previous: VerseNavigationItem | null;
    next: VerseNavigationItem | null;
}

export interface VerseAudioResponse {
    verse_key: string;
    recitation_id: number;
    audio_url: string;
    raw: Record<string, unknown>;
}

export function getVerseAudio(
    verseKey: string,
    recitationId: number,
): Promise<VerseAudioResponse> {
    const [chapterId, verseNumber] = verseKey.split(':');
    const query = new URLSearchParams({
        recitation_id: String(recitationId),
    });

    return api.get<VerseAudioResponse>(
        `/api/quran/audio/verse/${chapterId}/${verseNumber}?${query}`,
        { retry: 0 },
    );
}

export function getVerseNavigation(
    verseKey: string,
): Promise<VerseNavigationResponse> {
    const [chapterId, verseNumber] = verseKey.split(':');
    return api.get<VerseNavigationResponse>(
        `/api/quran/verses/${chapterId}/${verseNumber}/navigation`,
        { retry: 0 },
    );
}
