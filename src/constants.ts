export const MEDIA_BUCKET = 'public_media' as const;

export const VALID_MIME_TYPES = {
  image: ['image/avif', 'image/webp', 'image/jpeg'],
  video: ['video/webm', 'video/mp4'],
} as const;

export const HOME_PAGE_BACKGROUND = {
  primaryVideo: 'bg_hero_vid.av1.webm',
  secondaryVideo: 'bg_hero_vid.h264.mp4',
  poster: 'images/bg_hero_vid_first_frame.avif',
} as const;

export const PAGE_BACKGROUNDS = {
  bio: {
    jpg: {
      srcList: ['bg_hero_1-sm.jpg', 'bg_hero_1-md.jpg', 'bg_hero_1-lg.jpg'],
      mimeType: 'image/jpeg',
    },
    webp: {
      srcList: ['bg_hero_1-sm.webp', 'bg_hero_1-md.webp', 'bg_hero_1-lg.webp'],
      mimeType: 'image/webp',
    },
    avif: {
      srcList: ['bg_hero_1-sm.avif', 'bg_hero_1-md.avif', 'bg_hero_1-lg.avif'],
      mimeType: 'image/avif',
    },
  },
  schedule: {},
  songList: {},
  gallery: {},
  contact: {},
} as const;
