export type YouTubePlayer = {
  destroy: () => void;
  getPlayerState: () => number;
};

export type YouTubePlayerStateEvent = {
  data: number;
};

export type YouTubeNamespace = {
  Player: new (
    element: string | HTMLIFrameElement,
    options: {
      events?: {
        onStateChange?: (event: YouTubePlayerStateEvent) => void;
      };
    },
  ) => YouTubePlayer;
  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
};

export type YouTubePlayerCallbacks = {
  onPlay?: () => void;
  onPause?: () => void;
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}
