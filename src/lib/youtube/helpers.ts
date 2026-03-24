import type {
  YouTubeNamespace,
  YouTubePlayer,
  YouTubePlayerCallbacks,
} from './types';

const IFRAME_API_SRC = 'https://www.youtube.com/iframe_api';

let youtubeApiPromise: Promise<YouTubeNamespace> | null = null;

export function buildYouTubeEmbedSrc(src: string, origin?: string): string {
  const url = new URL(src);

  url.searchParams.set('enablejsapi', '1');
  url.searchParams.set('playsinline', '1');

  if (origin) {
    url.searchParams.set('origin', origin);
  }

  return url.toString();
}

export async function createYouTubePlayer(
  iframe: HTMLIFrameElement,
  { onPlay, onPause }: YouTubePlayerCallbacks,
): Promise<YouTubePlayer> {
  const YT = await loadYouTubeApi();

  return new YT.Player(iframe, {
    events: {
      onStateChange: ({ data }) => {
        if (data === YT.PlayerState.PLAYING) {
          onPlay?.();
        }

        if (data === YT.PlayerState.PAUSED || data === YT.PlayerState.ENDED) {
          onPause?.();
        }
      },
    },
  });
}

function loadYouTubeApi(): Promise<YouTubeNamespace> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('YouTube iframe API can only load in the browser.'));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise<YouTubeNamespace>((resolve, reject) => {
    const previousOnReady = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousOnReady?.();

      if (window.YT?.Player) {
        resolve(window.YT);
        return;
      }

      reject(new Error('YouTube iframe API loaded without a player.'));
    };

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${IFRAME_API_SRC}"]`);

    if (existingScript) {
      return;
    }

    const script = document.createElement('script');
    script.src = IFRAME_API_SRC;
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load the YouTube iframe API.'));

    document.head.appendChild(script);
  }).catch((error: unknown) => {
    youtubeApiPromise = null;
    throw error;
  });

  return youtubeApiPromise;
}
