import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';
import { buildYouTubeEmbedSrc, createYouTubePlayer } from '@/lib/youtube/helpers';
import type { YouTubePlayer } from '@/lib/youtube/types';

const DEFAULT_TITLE = 'YouTube video player';
const CONTAINER_CLASS_NAME = 'w-full aspect-video';
const IFRAME_CLASS_NAME = 'block size-full';

type EmbeddedVideoProps = {
  className?: string;
  src: string;
  title?: string;
  onPlay?: () => void;
  onPause?: () => void;
};

export default function EmbeddedVideo({
  className,
  src,
  title,
  onPlay,
  onPause,
}: EmbeddedVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);

  useEffect(() => {
    onPlayRef.current = onPlay;
    onPauseRef.current = onPause;
  }, [onPause, onPlay]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || typeof window === 'undefined') {
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.src = buildYouTubeEmbedSrc(src, window.location.origin);
    iframe.className = IFRAME_CLASS_NAME;
    iframe.title = title ?? DEFAULT_TITLE;
    iframe.allow =
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;

    container.replaceChildren(iframe);

    let player: YouTubePlayer | undefined;
    let disposed = false;

    void createYouTubePlayer(iframe, {
      onPlay: () => onPlayRef.current?.(),
      onPause: () => onPauseRef.current?.(),
    })
      .then((nextPlayer) => {
        if (disposed) {
          nextPlayer.destroy();
          return;
        }

        player = nextPlayer;
      })
      .catch((error: unknown) => {
        if (!disposed) {
          console.error('Failed to initialize embedded video player.', error);
        }
      });

    return () => {
      disposed = true;
      player?.destroy();
      container.replaceChildren();
    };
  }, [src, title]);

  return <div ref={containerRef} className={cn(CONTAINER_CLASS_NAME, className)} />;
}
