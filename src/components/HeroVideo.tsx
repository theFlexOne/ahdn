type Props = {
  urls: {
    src: string;
    type: string;
  } | {
    src: string;
    type: string;
  }[];
  posterSrc?: string;
  className?: string;
};

export default function HeroVideo({ posterSrc, urls, className }: Props) {
  urls = Array.isArray(urls) ? urls : [urls];
  return (
    <video
      poster={posterSrc}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
    >
      {urls.map((url, index) => (
        <source key={index} src={url.src} type={url.type} />
      ))}
    </video>
  );
}
