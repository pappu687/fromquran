import type { VerseNavigationResponse } from '@/api/quranAudio';
import { create } from 'zustand';

export interface QuranAudioPlayerState {
    isVisible: boolean;
    isPlaying: boolean;
    currentVerseKey: string | null;
    currentChapterId: number | null;
    currentVerseNumber: number | null;
    currentRecitationId: number | null;
    audioUrl: string | null;
    title: string | null;
    isLoading: boolean;
    error: string | null;
    canGoNext: boolean;
    canGoPrevious: boolean;
    navigation: VerseNavigationResponse | null;
}

export interface SetCurrentAudioPayload {
    verseKey: string;
    chapterId: number;
    verseNumber: number;
    recitationId: number;
    audioUrl: string;
    title?: string;
    navigation: VerseNavigationResponse;
    autoplay?: boolean;
}

interface QuranAudioPlayerStore extends QuranAudioPlayerState {
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setCurrentAudio: (payload: SetCurrentAudioPayload) => void;
    closePlayer: () => void;
    reset: () => void;
}

const initialState: QuranAudioPlayerState = {
    isVisible: false,
    isPlaying: false,
    currentVerseKey: null,
    currentChapterId: null,
    currentVerseNumber: null,
    currentRecitationId: null,
    audioUrl: null,
    title: null,
    isLoading: false,
    error: null,
    canGoNext: false,
    canGoPrevious: false,
    navigation: null,
};

export const useQuranAudioPlayerStore = create<QuranAudioPlayerStore>()(
    (set) => ({
        ...initialState,
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        setIsPlaying: (isPlaying) => set({ isPlaying }),
        setCurrentAudio: (payload) =>
            set({
                isVisible: true,
                isPlaying: payload.autoplay ?? true,
                currentVerseKey: payload.verseKey,
                currentChapterId: payload.chapterId,
                currentVerseNumber: payload.verseNumber,
                currentRecitationId: payload.recitationId,
                audioUrl: payload.audioUrl,
                title:
                    payload.title ??
                    `Surah ${payload.chapterId} ${payload.verseKey}`,
                isLoading: false,
                error: null,
                canGoNext: payload.navigation.next !== null,
                canGoPrevious: payload.navigation.previous !== null,
                navigation: payload.navigation,
            }),
        closePlayer: () =>
            set({
                isVisible: false,
                isPlaying: false,
                isLoading: false,
                error: null,
            }),
        reset: () => set(initialState),
    }),
);
