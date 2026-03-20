import { cn } from "@/lib/utils";
import type { ClassValue } from "clsx";
import { useState } from "react";

type HeroVideoProps = {
  primarySrc: string;
  secondarySrc: string;
  posterSrc: string;
  className?: ClassValue;
  fallbackImgClassName?: ClassValue;
};

export default function HeroVideo({ primarySrc, secondarySrc, posterSrc, className, fallbackImgClassName }: HeroVideoProps) {
  const [canPlay, setCanPlay] = useState(false);

  return (
    <div className={cn(
      "relative h-full w-full",
      "after:pointer-events-none after:absolute after:inset-0 after:bg-black/30 after:content-['']",
      className
    )}>
      <video
        className={cn(
          "absolute inset-0 h-full w-full object-cover",
          !canPlay && "hidden",
        )}
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
          className={cn(fallbackImgClassName)}
        />
      ) : null}
    </div>
  );
}
