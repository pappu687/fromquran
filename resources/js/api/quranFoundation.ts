import { api } from '@/lib/api-client';

export type QuranFoundationResponse = Record<string, unknown>;

const BASE_PATH = '/api/qf';

function buildPath(path: string): string {
    return `${BASE_PATH}${path}`;
}

export function getRecitations(): Promise<QuranFoundationResponse> {
    return api.get<QuranFoundationResponse>(buildPath('/resources/recitations'));
}

export function getRecitationInfo(
    id: number | string,
): Promise<QuranFoundationResponse> {
    return api.get<QuranFoundationResponse>(
        buildPath(`/resources/recitations/${id}`),
    );
}

export function getTranslations(): Promise<QuranFoundationResponse> {
    return api.get<QuranFoundationResponse>(buildPath('/resources/translations'));
}

export function getTranslationInfo(
    id: number | string,
): Promise<QuranFoundationResponse> {
    return api.get<QuranFoundationResponse>(
        buildPath(`/resources/translations/${id}`),
    );
}

export function getTafsirs(): Promise<QuranFoundationResponse> {
    return api.get<QuranFoundationResponse>(buildPath('/resources/tafsirs'));
}

export function getTafsirInfo(
    id: number | string,
): Promise<QuranFoundationResponse> {
    return api.get<QuranFoundationResponse>(buildPath(`/resources/tafsirs/${id}`));
}

export function getLanguages(): Promise<QuranFoundationResponse> {
    return api.get<QuranFoundationResponse>(buildPath('/resources/languages'));
}

export function getChapterReciters(): Promise<QuranFoundationResponse> {
    return api.get<QuranFoundationResponse>(
        buildPath('/resources/chapter-reciters'),
    );
}

export function getChapterInfos(): Promise<QuranFoundationResponse> {
    return api.get<QuranFoundationResponse>(buildPath('/resources/chapter-infos'));
}

export function getRecitationStyles(): Promise<QuranFoundationResponse> {
    return api.get<QuranFoundationResponse>(
        buildPath('/resources/recitation-styles'),
    );
}

export function getVerseMedia(): Promise<QuranFoundationResponse> {
    return api.get<QuranFoundationResponse>(buildPath('/resources/verse-media'));
}

export function getChapterRecitations(
    chapterId: number | string,
): Promise<QuranFoundationResponse> {
    return api.get<QuranFoundationResponse>(
        buildPath(`/audio/chapter-recitations/${chapterId}`),
    );
}

export function getChapterRecitation(
    chapterId: number | string,
    recitationId: number | string,
): Promise<QuranFoundationResponse> {
    return api.get<QuranFoundationResponse>(
        buildPath(`/audio/chapter-recitations/${chapterId}/${recitationId}`),
    );
}

export function getVerseRecitationsByChapter(
    chapterId: number | string,
    recitationId: number | string,
): Promise<QuranFoundationResponse> {
    return api.get<QuranFoundationResponse>(
        buildPath(
            `/audio/verse-recitations/by-chapter/${chapterId}/${recitationId}`,
        ),
    );
}

export function getVerseRecitationsByKey(
    verseKey: string,
    recitationId: number | string,
): Promise<QuranFoundationResponse> {
    return api.get<QuranFoundationResponse>(
        buildPath(`/audio/verse-recitations/by-key/${verseKey}/${recitationId}`),
    );
}
