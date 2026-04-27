import {
    getVerseAudio,
    getVerseNavigation,
    type VerseNavigationItem,
    type VerseNavigationResponse,
} from '@/api/quranAudio';
import {
    useQuranAudioPlayerStore,
    type QuranAudioPlayerState,
    type SetCurrentAudioPayload,
} from '@/store/use-quran-audio-player';
import { useShallow } from 'zustand/react/shallow';

interface PlayVerseAudioParams {
    verseKey: string;
    recitationId: number;
    title?: string;
}

interface UseQuranAudioPlayerReturn {
    playVerseAudio: (params: PlayVerseAudioParams) => Promise<void>;
    closePlayer: () => void;
    playNextVerse: () => Promise<void>;
    playPreviousVerse: () => Promise<void>;
    setCurrentAudio: (payload: SetCurrentAudioPayload) => void;
    playerState: QuranAudioPlayerState;
}

function defaultTitle(verse: VerseNavigationItem): string {
    return `Surah ${verse.chapter_id} ${verse.verse_key}`;
}

function errorMessage(error: unknown): string {
    return error instanceof Error
        ? error.message
        : 'Unable to load verse audio.';
}

async function resolveAudio(
    verseKey: string,
    recitationId: number,
    title?: string,
): Promise<SetCurrentAudioPayload> {
    const [audio, navigation] = await Promise.all([
        getVerseAudio(verseKey, recitationId),
        getVerseNavigation(verseKey),
    ]);

    return {
        verseKey: audio.verse_key,
        chapterId: navigation.current.chapter_id,
        verseNumber: navigation.current.verse_number,
        recitationId: audio.recitation_id,
        audioUrl: audio.audio_url,
        title: title ?? defaultTitle(navigation.current),
        navigation,
        autoplay: true,
    };
}

async function playNavigationVerse(
    navigation: VerseNavigationResponse | null,
    target: 'next' | 'previous',
    recitationId: number | null,
    setLoading: (isLoading: boolean) => void,
    setError: (error: string | null) => void,
    setCurrentAudio: (payload: SetCurrentAudioPayload) => void,
): Promise<void> {
    const verse = navigation?.[target];

    if (!verse || !recitationId) {
        return;
    }

    setLoading(true);
    setError(null);

    try {
        const payload = await resolveAudio(
            verse.verse_key,
            recitationId,
            defaultTitle(verse),
        );
        setCurrentAudio(payload);
    } catch (error) {
        setError(errorMessage(error));
        setLoading(false);
    }
}

export function useQuranAudioPlayer(): UseQuranAudioPlayerReturn {
    const playerState = useQuranAudioPlayerStore(
        useShallow((state) => ({
            isVisible: state.isVisible,
            isPlaying: state.isPlaying,
            currentVerseKey: state.currentVerseKey,
            currentChapterId: state.currentChapterId,
            currentVerseNumber: state.currentVerseNumber,
            currentRecitationId: state.currentRecitationId,
            audioUrl: state.audioUrl,
            title: state.title,
            isLoading: state.isLoading,
            error: state.error,
            canGoNext: state.canGoNext,
            canGoPrevious: state.canGoPrevious,
            navigation: state.navigation,
        })),
    );
    const setLoading = useQuranAudioPlayerStore((state) => state.setLoading);
    const setError = useQuranAudioPlayerStore((state) => state.setError);
    const closePlayer = useQuranAudioPlayerStore((state) => state.closePlayer);
    const setCurrentAudio = useQuranAudioPlayerStore(
        (state) => state.setCurrentAudio,
    );

    const playVerseAudio = async ({
        verseKey,
        recitationId,
        title,
    }: PlayVerseAudioParams): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            const payload = await resolveAudio(verseKey, recitationId, title);
            setCurrentAudio(payload);
        } catch (error) {
            setError(errorMessage(error));
            setLoading(false);
        }
    };

    const playNextVerse = async (): Promise<void> => {
        await playNavigationVerse(
            playerState.navigation,
            'next',
            playerState.currentRecitationId,
            setLoading,
            setError,
            setCurrentAudio,
        );
    };

    const playPreviousVerse = async (): Promise<void> => {
        await playNavigationVerse(
            playerState.navigation,
            'previous',
            playerState.currentRecitationId,
            setLoading,
            setError,
            setCurrentAudio,
        );
    };

    return {
        playVerseAudio,
        closePlayer,
        playNextVerse,
        playPreviousVerse,
        setCurrentAudio,
        playerState,
    };
}
