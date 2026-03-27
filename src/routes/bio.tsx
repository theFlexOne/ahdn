import { buildSrc, buildSrcSet } from '@/lib/media';
import Bio from '@/pages/bio/Bio';

export default function BioRoute() {
  const background = {
    src: buildSrc('bg_hero_1-md.jpg'),
    sources: [
      {
        type: 'image/jpeg',
        srcSet: buildSrcSet('bg_hero_1', 'jpg'),
      },
      {
        type: 'image/webp',
        srcSet: buildSrcSet('bg_hero_1', 'webp'),
      },
      {
        type: 'image/avif',
        srcSet: buildSrcSet('bg_hero_1', 'avif'),
      },
    ],
  };

  return <Bio background={background} />;
}
