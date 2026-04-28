import 'react-h5-audio-player/lib/styles.css';

import { Button } from '@/components/ui/button';
import { useQuranAudioPlayer } from '@/hooks/useQuranAudioPlayer';
import { cn } from '@/lib/utils';
import { useQuranAudioPlayerStore } from '@/store/use-quran-audio-player';
import { Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';

const loadAudioPlayer = () => import('react-h5-audio-player');

export function QuranFloatingAudioPlayer() {
    const { closePlayer, playNextVerse, playPreviousVerse, playerState } =
        useQuranAudioPlayer();
    const setIsPlaying = useQuranAudioPlayerStore(
        (state) => state.setIsPlaying,
    );
    const playerRef = useRef<any>(null);
    const [AudioModule, setAudioModule] = useState<any>(null);

    useEffect(() => {
        if (typeof document === 'undefined') return;

        document.body.classList.toggle(
            'has-quran-floating-audio-player',
            playerState.isVisible,
        );

        return () => {
            document.body.classList.remove('has-quran-floating-audio-player');
        };
    }, [playerState.isVisible]);

    useEffect(() => {
        if (playerState.isVisible && playerState.audioUrl && !AudioModule) {
            loadAudioPlayer().then((module) => {
                setAudioModule(module);
            });
        }
    }, [playerState.isVisible, playerState.audioUrl, AudioModule]);

    if (!playerState.isVisible || !playerState.audioUrl) {
        return null;
    }

    const handleClose = () => {
        playerRef.current?.audio.current?.pause();
        closePlayer();
    };

    const handlePrevious = () => {
        if (!playerState.canGoPrevious) return;
        void playPreviousVerse();
    };

    const handleNext = () => {
        if (!playerState.canGoNext) return;
        void playNextVerse();
    };

    if (!AudioModule) {
        return (
            <div className="fixed right-0 bottom-0 left-0 z-[9999] border-t bg-background/95 p-4">
                <div className="mx-auto max-w-6xl">
                    <div className="h-16 flex items-center justify-center">
                        Loading audio player...
                    </div>
                </div>
            </div>
        );
    }

    const { default: H5AudioPlayer, RHAP_UI } = AudioModule;

    return (
        <div
            className={cn(
                'quran-floating-audio-player fixed right-0 bottom-0 left-0 z-[9999] border-t bg-background/95 shadow-[0_-12px_32px_rgba(15,23,42,0.14)] backdrop-blur supports-[backdrop-filter]:bg-background/90',
                !playerState.canGoPrevious && 'is-previous-disabled',
                !playerState.canGoNext && 'is-next-disabled',
            )}
            data-testid="quran-floating-audio-player"
        >
            <div className="mx-auto max-w-6xl px-2 py-0.5 sm:px-3">
                <H5AudioPlayer
                    ref={playerRef}
                    src={playerState.audioUrl}
                    autoPlay={playerState.isPlaying}
                    autoPlayAfterSrcChange
                    showSkipControls
                    showJumpControls
                    progressJumpSteps={{ backward: 5000, forward: 5000 }}
                    layout="horizontal-reverse"
                    className="quran-h5-player"
                    customAdditionalControls={[
                        <Button
                            key="close-audio-player"
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 shrink-0 p-0"
                            aria-label="Close audio player"
                            onClick={handleClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>,
                    ]}
                    customControlsSection={[
                        RHAP_UI.ADDITIONAL_CONTROLS,
                        RHAP_UI.MAIN_CONTROLS,
                        RHAP_UI.VOLUME_CONTROLS,
                    ]}
                    onClickPrevious={handlePrevious}
                    onClickNext={handleNext}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    onError={() =>
                        useQuranAudioPlayerStore
                            .getState()
                            .setError('Unable to play this audio file.')
                    }
                    i18nAriaLabels={{
                        player: 'Quran verse audio player',
                        previous: playerState.canGoPrevious
                            ? 'Previous verse'
                            : 'Previous verse unavailable',
                        next: playerState.canGoNext
                            ? 'Next verse'
                            : 'Next verse unavailable',
                        rewind: 'Rewind current verse audio',
                        forward: 'Forward current verse audio',
                        play: 'Play verse audio',
                        pause: 'Pause verse audio',
                        progressControl: 'Audio progress',
                        volumeControl: 'Audio volume',
                    }}
                    customIcons={{
                        play: <Play className="h-8 w-8" />,
                        pause: <Pause className="h-8 w-8" />,
                        previous: (
                            <SkipBack
                                className="h-6 w-6"
                                aria-disabled={!playerState.canGoPrevious}
                            />
                        ),
                        next: (
                            <SkipForward
                                className="h-6 w-6"
                                aria-disabled={!playerState.canGoNext}
                            />
                        ),
                    }}
                />
            </div>
        </div>
    );
}
