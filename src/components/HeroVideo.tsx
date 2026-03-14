import { cn } from "@/lib/utils";
import type { ClassValue } from "clsx";
import { useEffect, useRef, useState } from "react";

type HeroVideoProps = {
  urls: {
    src: string;
    type: string;
  }[];
  posterSrc: string;
  className?: ClassValue;
  fallbackImgClassName?: ClassValue;
};

export default function HeroVideo({ posterSrc, urls, className, fallbackImgClassName }: HeroVideoProps) {
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
      className={cn(className)}
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
    <img srcSet={posterSrc} alt="A Hard Day's Night" className={cn(fallbackImgClassName)} />
  );
}
