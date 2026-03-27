const PAGE_BACKGROUNDS = {
  home: {
    paths: ['heroes/home'],
    types: ['avif'],
    defaultType: 'avif',
    alt: 'Band on stage',
  },
  bio: {
    paths: ['heroes/bio'],
    types: ['avif'],
    defaultType: 'avif',
    alt: 'Band portrait',
  },
  schedule: {
    paths: ['heroes/schedule'],
    types: ['avif'],
    defaultType: 'avif',
    alt: 'Concert lights',
  },
  gallery: {
    paths: ['heroes/gallery'],
    types: ['avif'],
    defaultType: 'avif',
    alt: 'Live performance',
  },
  contact: {
    paths: ['heroes/contact'],
    types: ['avif'],
    defaultType: 'avif',
    alt: 'Stage close-up',
  },
} as const;

export default PAGE_BACKGROUNDS;
