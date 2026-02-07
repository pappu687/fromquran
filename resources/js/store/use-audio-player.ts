import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface VerseTiming {
    verse_key: string;
    timestamp_from: number;
    timestamp_to: number;
    duration: number;
    segments: number[][];
}

export interface ChapterAudioFile {
    id: number;
    chapter_id: number;
    file_size: number;
    format: string;
    audio_url: string;
    duration: number;
    reciter_id: number;
    reciter_name: string;
    verse_timings: VerseTiming[];
}

export interface CurrentVerse {
    chapterId: number;
    verseNumber: number;
    verseKey: string;
}

export interface AudioPlayerState {
    // Player state
    isPlaying: boolean;
    isInitialized: boolean;
    currentChapterId: number | null;
    currentReciterId: number | null;
    currentVerse: CurrentVerse | null;
    audioData: ChapterAudioFile | null;
    currentTime: number;
    volume: number;
    isMuted: boolean;

    // Playback controls
    play: () => void;
    pause: () => void;
    stop: () => void;
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
    setMuted: (muted: boolean) => void;

    // Chapter/verse management
    playChapter: (chapterId: number, reciterId: number, verseNumber?: number) => Promise<void>;
    playVerse: (chapterId: number, verseNumber: number, reciterId: number) => Promise<void>;
    playNextVerse: () => void;
    playPreviousVerse: () => void;
    goToChapter: (chapterId: number) => void;

    // Audio data management
    setAudioData: (data: ChapterAudioFile | null) => void;
    setCurrentTime: (time: number) => void;
    setIsPlaying: (playing: boolean) => void;

    // Reciter preference
    setReciterId: (reciterId: number) => void;

    // Reset player
    reset: () => void;
}

export const useAudioPlayer = create<AudioPlayerState>()(
    persist(
        (set, get) => ({
            // Initial state
            isPlaying: false,
            isInitialized: false,
            currentChapterId: null,
            currentReciterId: null,
            currentVerse: null,
            audioData: null,
            currentTime: 0,
            volume: 1,
            isMuted: false,

            play: () => set({ isPlaying: true }),

            pause: () => set({ isPlaying: false }),

            stop: () => set({ isPlaying: false, currentTime: 0 }),

            seek: (time: number) => set({ currentTime: time }),

            setVolume: (volume: number) => set({ volume: Math.max(0, Math.min(1, volume)) }),

            setMuted: (muted: boolean) => set({ isMuted: muted }),

            playChapter: async (chapterId: number, reciterId: number, verseNumber?: number) => {
                const state = get();

                // If same chapter and reciter, just play
                if (state.currentChapterId === chapterId && state.currentReciterId === reciterId && state.audioData) {
                    if (verseNumber) {
                        // Seek to verse start time
                        const verseTiming = state.audioData.verse_timings.find(
                            (vt) => vt.verse_key === `${chapterId}:${verseNumber}`
                        );
                        if (verseTiming) {
                            set({
                                currentTime: verseTiming.timestamp_from / 1000,
                                currentVerse: {
                                    chapterId,
                                    verseNumber,
                                    verseKey: verseTiming.verse_key,
                                },
                                isPlaying: true,
                            });
                        }
                    } else {
                        set({ isPlaying: true });
                    }
                    return;
                }

                // Fetch new chapter audio
                try {
                    const response = await fetch(`/api/quran/audio/${reciterId}/${chapterId}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch audio');
                    }
                    const data = await response.json();
                    const audioFile = data.audio_files?.[0];

                    if (!audioFile) {
                        throw new Error('No audio file found');
                    }

                    // Determine start time
                    let startTime = 0;
                    let startVerse = null;

                    if (verseNumber) {
                        const verseTiming = audioFile.verse_timings.find(
                            (vt: VerseTiming) => vt.verse_key === `${chapterId}:${verseNumber}`
                        );
                        if (verseTiming) {
                            startTime = verseTiming.timestamp_from / 1000;
                            startVerse = {
                                chapterId,
                                verseNumber,
                                verseKey: verseTiming.verse_key,
                            };
                        }
                    } else {
                        // Start from first verse
                        const firstVerse = audioFile.verse_timings[0];
                        if (firstVerse) {
                            startVerse = {
                                chapterId,
                                verseNumber: firstVerse.verse_key.split(':')[1],
                                verseKey: firstVerse.verse_key,
                            };
                        }
                    }

                    set({
                        audioData: audioFile,
                        currentChapterId: chapterId,
                        currentReciterId: reciterId,
                        currentTime: startTime,
                        currentVerse: startVerse,
                        isPlaying: true,
                        isInitialized: true,
                    });
                } catch (error) {
                    console.error('Error playing chapter:', error);
                }
            },

            playVerse: async (chapterId: number, verseNumber: number, reciterId: number) => {
                await get().playChapter(chapterId, reciterId, verseNumber);
            },

            playNextVerse: () => {
                const state = get();
                if (!state.audioData || !state.currentVerse) return;

                const currentIndex = state.audioData.verse_timings.findIndex(
                    (vt) => vt.verse_key === state.currentVerse?.verseKey
                );

                if (currentIndex >= 0 && currentIndex < state.audioData.verse_timings.length - 1) {
                    const nextVerse = state.audioData.verse_timings[currentIndex + 1];
                    const startTime = nextVerse.timestamp_from / 1000;
                    set({
                        currentTime: startTime,
                        currentVerse: {
                            chapterId: state.currentChapterId!,
                            verseNumber: parseInt(nextVerse.verse_key.split(':')[1]),
                            verseKey: nextVerse.verse_key,
                        },
                    });
                }
            },

            playPreviousVerse: () => {
                const state = get();
                if (!state.audioData || !state.currentVerse) return;

                const currentIndex = state.audioData.verse_timings.findIndex(
                    (vt) => vt.verse_key === state.currentVerse?.verseKey
                );

                if (currentIndex > 0) {
                    const prevVerse = state.audioData.verse_timings[currentIndex - 1];
                    const startTime = prevVerse.timestamp_from / 1000;
                    set({
                        currentTime: startTime,
                        currentVerse: {
                            chapterId: state.currentChapterId!,
                            verseNumber: parseInt(prevVerse.verse_key.split(':')[1]),
                            verseKey: prevVerse.verse_key,
                        },
                    });
                }
            },

            goToChapter: (chapterId: number) => {
                const state = get();
                if (state.currentReciterId) {
                    get().playChapter(chapterId, state.currentReciterId);
                }
            },

            setAudioData: (data: ChapterAudioFile | null) => set({ audioData: data }),

            setCurrentTime: (time: number) => set({ currentTime: time }),

            setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),

            setReciterId: (reciterId: number) => set({ currentReciterId: reciterId }),

            reset: () =>
                set({
                    isPlaying: false,
                    isInitialized: false,
                    currentChapterId: null,
                    currentVerse: null,
                    currentTime: 0,
                }),
        }),
        {
            name: 'audio-player-storage',
            partialize: (state) => ({
                currentReciterId: state.currentReciterId,
                volume: state.volume,
                isMuted: state.isMuted,
            }),
        }
    )
);
