import type { ComponentPropsWithoutRef } from 'react';

export type PictureSource = ComponentPropsWithoutRef<'source'>;

export type SrcAndSources = {
  src: string;
  sources?: readonly PictureSource[];
};

export type ImageProps = Omit<ComponentPropsWithoutRef<'img'>, 'src'> & SrcAndSources;

export default function Image({ src, sources, alt, className, ...imgProps }: ImageProps) {
  return (
    <picture className={className}>
      {sources?.map((source, index) => (
        <source
          key={`${source.type ?? 'default'}:${source.media ?? ''}:${source.srcSet ?? index}`}
          {...source}
        />
      ))}
      <img {...imgProps} alt={alt ?? ''} className={'h-full w-full object-cover'} src={src} />
    </picture>
  );
}
