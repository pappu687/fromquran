import { QuranFloatingAudioPlayer } from '@/components/audio/QuranFloatingAudioPlayer';
import { useQuranAudioPlayer } from '@/hooks/useQuranAudioPlayer';
import { useQuranAudioPlayerStore } from '@/store/use-quran-audio-player';
import {
    act,
    cleanup,
    fireEvent,
    render,
    renderHook,
    screen,
} from '@testing-library/react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getVerseAudio, getVerseNavigation } from '@/api/quranAudio';

vi.mock('@/api/quranAudio', () => ({
    getVerseAudio: vi.fn(),
    getVerseNavigation: vi.fn(),
}));

const { pauseMock } = vi.hoisted(() => ({
    pauseMock: vi.fn(),
}));

vi.mock('react-h5-audio-player', async () => {
    const { forwardRef, useImperativeHandle } = await import('react');

    return {
        RHAP_UI: {
            ADDITIONAL_CONTROLS: 'ADDITIONAL_CONTROLS',
            MAIN_CONTROLS: 'MAIN_CONTROLS',
            VOLUME_CONTROLS: 'VOLUME_CONTROLS',
        },
        default: forwardRef(function MockAudioPlayer(
            props: {
                src?: string;
                onClickNext?: () => void;
                onClickPrevious?: () => void;
                onPlay?: () => void;
                onPause?: () => void;
                customAdditionalControls?: React.ReactNode[];
            },
            ref,
        ) {
            useImperativeHandle(ref, () => ({
                audio: {
                    current: {
                        pause: pauseMock,
                    },
                },
            }));

            return (
                <div data-testid="mock-audio-player" data-src={props.src}>
                    {props.customAdditionalControls}
                    <button type="button" onClick={props.onClickPrevious}>
                        Previous verse
                    </button>
                    <button type="button" onClick={props.onClickNext}>
                        Next verse
                    </button>
                    <button type="button" onClick={props.onPlay}>
                        Play
                    </button>
                    <button type="button" onClick={props.onPause}>
                        Pause
                    </button>
                </div>
            );
        }),
    };
});

const mockedGetVerseAudio = vi.mocked(getVerseAudio);
const mockedGetVerseNavigation = vi.mocked(getVerseNavigation);

const middleNavigation = {
    current: { verse_key: '2:255', chapter_id: 2, verse_number: 255 },
    previous: { verse_key: '2:254', chapter_id: 2, verse_number: 254 },
    next: { verse_key: '2:256', chapter_id: 2, verse_number: 256 },
};

beforeEach(() => {
    useQuranAudioPlayerStore.getState().reset();
    mockedGetVerseAudio.mockReset();
    mockedGetVerseNavigation.mockReset();
    pauseMock.mockReset();
});

afterEach(() => {
    cleanup();
    document.body.classList.remove('has-quran-floating-audio-player');
});

describe('QuranFloatingAudioPlayer', () => {
    it('is hidden initially', () => {
        render(<QuranFloatingAudioPlayer />);

        expect(
            screen.queryByTestId('quran-floating-audio-player'),
        ).not.toBeInTheDocument();
    });

    it('appears after playVerseAudio', async () => {
        mockedGetVerseAudio.mockResolvedValue({
            verse_key: '2:255',
            recitation_id: 7,
            audio_url: 'https://audio.qurancdn.com/Alafasy/mp3/002255.mp3',
            raw: {},
        });
        mockedGetVerseNavigation.mockResolvedValue(middleNavigation);

        const { result } = renderHook(() => useQuranAudioPlayer());

        await act(async () => {
            await result.current.playVerseAudio({
                verseKey: '2:255',
                recitationId: 7,
                title: 'Surah Al-Baqarah 2:255',
            });
        });

        render(<QuranFloatingAudioPlayer />);

        expect(
            screen.getByTestId('quran-floating-audio-player'),
        ).toBeInTheDocument();
        expect(screen.getByTestId('mock-audio-player')).toHaveAttribute(
            'data-src',
            'https://audio.qurancdn.com/Alafasy/mp3/002255.mp3',
        );
    });

    it('close hides and pauses player', () => {
        act(() => {
            useQuranAudioPlayerStore.getState().setCurrentAudio({
                verseKey: '2:255',
                chapterId: 2,
                verseNumber: 255,
                recitationId: 7,
                audioUrl: 'https://audio.qurancdn.com/Alafasy/mp3/002255.mp3',
                title: 'Surah Al-Baqarah 2:255',
                navigation: middleNavigation,
            });
        });

        render(<QuranFloatingAudioPlayer />);
        fireEvent.click(screen.getByLabelText('Close audio player'));

        expect(pauseMock).toHaveBeenCalledTimes(1);
        expect(
            screen.queryByTestId('quran-floating-audio-player'),
        ).not.toBeInTheDocument();
    });
});

describe('useQuranAudioPlayer', () => {
    it('next does nothing when next is null', async () => {
        const { result } = renderHook(() => useQuranAudioPlayer());

        act(() => {
            result.current.setCurrentAudio({
                verseKey: '2:286',
                chapterId: 2,
                verseNumber: 286,
                recitationId: 7,
                audioUrl: 'https://audio.qurancdn.com/Alafasy/mp3/002286.mp3',
                navigation: {
                    current: {
                        verse_key: '2:286',
                        chapter_id: 2,
                        verse_number: 286,
                    },
                    previous: {
                        verse_key: '2:285',
                        chapter_id: 2,
                        verse_number: 285,
                    },
                    next: null,
                },
            });
        });

        await act(async () => {
            await result.current.playNextVerse();
        });

        expect(mockedGetVerseAudio).not.toHaveBeenCalled();
    });

    it('previous does nothing when previous is null', async () => {
        const { result } = renderHook(() => useQuranAudioPlayer());

        act(() => {
            result.current.setCurrentAudio({
                verseKey: '2:1',
                chapterId: 2,
                verseNumber: 1,
                recitationId: 7,
                audioUrl: 'https://audio.qurancdn.com/Alafasy/mp3/002001.mp3',
                navigation: {
                    current: {
                        verse_key: '2:1',
                        chapter_id: 2,
                        verse_number: 1,
                    },
                    previous: null,
                    next: {
                        verse_key: '2:2',
                        chapter_id: 2,
                        verse_number: 2,
                    },
                },
            });
        });

        await act(async () => {
            await result.current.playPreviousVerse();
        });

        expect(mockedGetVerseAudio).not.toHaveBeenCalled();
    });

    it('next fetches next verse audio when available', async () => {
        mockedGetVerseAudio.mockResolvedValue({
            verse_key: '2:256',
            recitation_id: 7,
            audio_url: 'https://audio.qurancdn.com/Alafasy/mp3/002256.mp3',
            raw: {},
        });
        mockedGetVerseNavigation.mockResolvedValue({
            current: { verse_key: '2:256', chapter_id: 2, verse_number: 256 },
            previous: { verse_key: '2:255', chapter_id: 2, verse_number: 255 },
            next: { verse_key: '2:257', chapter_id: 2, verse_number: 257 },
        });
        const { result } = renderHook(() => useQuranAudioPlayer());

        act(() => {
            result.current.setCurrentAudio({
                verseKey: '2:255',
                chapterId: 2,
                verseNumber: 255,
                recitationId: 7,
                audioUrl: 'https://audio.qurancdn.com/Alafasy/mp3/002255.mp3',
                navigation: middleNavigation,
            });
        });

        await act(async () => {
            await result.current.playNextVerse();
        });

        expect(mockedGetVerseAudio).toHaveBeenCalledWith('2:256', 7);
        expect(result.current.playerState.currentVerseKey).toBe('2:256');
    });

    it('previous fetches previous verse audio when available', async () => {
        mockedGetVerseAudio.mockResolvedValue({
            verse_key: '2:254',
            recitation_id: 7,
            audio_url: 'https://audio.qurancdn.com/Alafasy/mp3/002254.mp3',
            raw: {},
        });
        mockedGetVerseNavigation.mockResolvedValue({
            current: { verse_key: '2:254', chapter_id: 2, verse_number: 254 },
            previous: { verse_key: '2:253', chapter_id: 2, verse_number: 253 },
            next: { verse_key: '2:255', chapter_id: 2, verse_number: 255 },
        });
        const { result } = renderHook(() => useQuranAudioPlayer());

        act(() => {
            result.current.setCurrentAudio({
                verseKey: '2:255',
                chapterId: 2,
                verseNumber: 255,
                recitationId: 7,
                audioUrl: 'https://audio.qurancdn.com/Alafasy/mp3/002255.mp3',
                navigation: middleNavigation,
            });
        });

        await act(async () => {
            await result.current.playPreviousVerse();
        });

        expect(mockedGetVerseAudio).toHaveBeenCalledWith('2:254', 7);
        expect(result.current.playerState.currentVerseKey).toBe('2:254');
    });
});
