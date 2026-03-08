import { useEffect, useRef, useState } from "react";

type Props = {
  urls: {
    src: string;
    type: string;
  }[];
  posterSrcList: string[];
  className?: string;
};

export default function HeroVideo({ posterSrcList, urls, className }: Props) {
  const [canPlay, setCanPlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.oncanplay = () => {
        setCanPlay(true);
      };
    }
  }, []);

  return canPlay ? (
    <video
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
  ) : (
    <img srcSet={posterSrcList.join(",")} alt="A Hard Day's Night" className={className} />
  );
}
