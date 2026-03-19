import { cn } from "@/lib/utils";
import type { ClassValue } from "clsx";
import { useState } from "react";

type HeroVideoProps = {
  primarySrc: string;
  secondarySrc: string;
  posterSrc: string;
  className?: ClassValue;
  fallbackImgClassName?: ClassValue;
  dim?: number;
};

export default function HeroVideo({ primarySrc, secondarySrc, posterSrc, className, fallbackImgClassName, dim = 0 }: HeroVideoProps) {
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
        <source src={primarySrc} type="video/webm" />
        <source src={secondarySrc} type="video/mp4" />
      </video>
      {!canPlay ? (
        <img
          src={posterSrc}
          className={cn(className, fallbackImgClassName)}
        />
      ) : null}
      <div className="absolute inset-0" style={{ backgroundColor }} />
    </>
  );
}
