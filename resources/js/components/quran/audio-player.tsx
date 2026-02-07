import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAudioPlayer } from '@/store/use-audio-player';
import { ChevronLeft, ChevronRight, Pause, Play, X, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function AudioPlayer() {
    const {
        isPlaying,
        isInitialized,
        audioData,
        currentVerse,
        currentTime,
        volume,
        isMuted,
        play,
        pause,
        seek,
        setVolume,
        setMuted,
        playNextVerse,
        playPreviousVerse,
        reset,
    } = useAudioPlayer();

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [duration, setDuration] = useState(0);
    const [progress, setProgress] = useState(0);

    // Initialize audio element
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const audio = new Audio();
        audioRef.current = audio;

        audio.addEventListener('loadedmetadata', () => {
            setDuration(audio.duration);
        });

        audio.addEventListener('timeupdate', () => {
            setProgress(audio.currentTime);
        });

        audio.addEventListener('ended', () => {
            // Auto-advance to next verse
            playNextVerse();
        });

        return () => {
            audio.pause();
            audio.removeEventListener('loadedmetadata', () => {});
            audio.removeEventListener('timeupdate', () => {});
            audio.removeEventListener('ended', () => {});
        };
    }, []);

    // Update audio source when audioData changes
    useEffect(() => {
        if (!audioRef.current || !audioData) return;

        const audio = audioRef.current;
        audio.src = audioData.audio_url;
        audio.load();
    }, [audioData]);

    // Handle play/pause
    useEffect(() => {
        if (!audioRef.current || !audioData) return;

        const audio = audioRef.current;

        if (isPlaying) {
            audio.play().catch((error) => {
                console.error('Error playing audio:', error);
            });
        } else {
            audio.pause();
        }
    }, [isPlaying, audioData]);

    // Handle seek
    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = currentTime;
    }, [currentTime]);

    // Handle volume change
    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.volume = isMuted ? 0 : volume;
    }, [volume, isMuted]);

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleSeek = (value: number[]) => {
        const newTime = value[0];
        seek(newTime);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }
    };

    const handleVolumeChange = (value: number[]) => {
        const newVolume = value[0];
        setVolume(newVolume);
        if (newVolume === 0) {
            setMuted(true);
        } else {
            setMuted(false);
        }
    };

    const handlePrevious = () => {
        // If more than 3 seconds into the verse, restart it
        if (audioRef.current && audioRef.current.currentTime > 3) {
            seek(currentVerse?.timestamp_from || 0);
            if (audioRef.current) {
                audioRef.current.currentTime = (currentVerse?.timestamp_from || 0) / 1000;
            }
        } else {
            playPreviousVerse();
        }
    };

    const handleClose = () => {
        reset();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    if (!isInitialized || !audioData) {
        return null;
    }

    const getCurrentVerseTiming = () => {
        if (!currentVerse || !audioData) return null;
        return audioData.verse_timings.find((vt) => vt.verse_key === currentVerse.verseKey);
    };

    const currentVerseTiming = getCurrentVerseTiming();
    const verseStartTime = currentVerseTiming ? currentVerseTiming.timestamp_from / 1000 : 0;
    const verseEndTime = currentVerseTiming ? currentVerseTiming.timestamp_to / 1000 : duration;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-lg">
            <audio ref={audioRef} />

            {/* Progress Bar - Full width at top */}
            <div className="group relative h-1 w-full bg-muted hover:h-2 transition-all">
                <div
                    className="absolute h-full bg-primary transition-all"
                    style={{ width: `${(progress / duration) * 100}%` }}
                />
                <Slider
                    value={[progress]}
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="absolute inset-0 h-full w-full opacity-0 group-hover:opacity-100 cursor-pointer"
                />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between px-4 py-3">
                {/* Current Verse Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="text-sm">
                        <p className="font-medium truncate">
                            {currentVerse
                                ? `Chapter ${currentVerse.chapterId}:${currentVerse.verseNumber}`
                                : 'Chapter ' + audioData.chapter_id}
                        </p>
                        {currentVerseTiming && (
                            <p className="text-xs text-muted-foreground">
                                {formatTime(verseStartTime)} - {formatTime(verseEndTime)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Main Controls */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePrevious}
                        className="h-9 w-9 p-0"
                        disabled={!audioData || !currentVerse}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={isPlaying ? pause : play}
                        className="h-10 w-10 p-0 rounded-full"
                    >
                        {isPlaying ? (
                            <Pause className="h-5 w-5" />
                        ) : (
                            <Play className="h-5 w-5 ml-0.5" />
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={playNextVerse}
                        className="h-9 w-9 p-0"
                        disabled={!audioData || !currentVerse}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Time & Volume */}
                <div className="flex items-center gap-4 flex-1 justify-end">
                    <span className="text-sm text-muted-foreground">
                        {formatTime(progress)} / {formatTime(duration)}
                    </span>

                    <div className="hidden sm:flex items-center gap-2 w-32">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMuted(!isMuted)}
                            className="h-8 w-8 p-0"
                        >
                            {isMuted || volume === 0 ? (
                                <VolumeX className="h-4 w-4" />
                            ) : (
                                <Volume2 className="h-4 w-4" />
                            )}
                        </Button>
                        <Slider
                            value={[isMuted ? 0 : volume]}
                            min={0}
                            max={1}
                            step={0.01}
                            onValueChange={handleVolumeChange}
                            className="flex-1"
                        />
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClose}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
