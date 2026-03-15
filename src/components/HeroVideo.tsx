import { cn } from "@/lib/utils";
import type { ClassValue } from "clsx";
import { useState } from "react";

type HeroVideoProps = {
  urls: {
    src: string;
    type: string;
  }[];
  posterSrc: string;
  className?: ClassValue;
  fallbackImgClassName?: ClassValue;
  dim?: number;
};

export default function HeroVideo({ posterSrc, urls, className, fallbackImgClassName, dim = 0 }: HeroVideoProps) {
  const [canPlay, setCanPlay] = useState(false);
  const backgroundColor = `rgba(0, 0, 0, ${dim / 100})`;

  return (
    <>
      <video
        className={cn(className, !canPlay && "hidden")}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={posterSrc}
        onCanPlay={() => setCanPlay(true)}
      >
        {urls.map((url, index) => (
          <source key={index} src={url.src} type={url.type} />
        ))}
      </video>
      {!canPlay ? (
        <img
          src={posterSrc}
          className={cn(fallbackImgClassName)}
        />
      ) : null}
      <div className="absolute inset-0" style={{ backgroundColor }} />
    </>
  );
}
