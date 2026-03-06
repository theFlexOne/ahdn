import { useEffect, useRef, useState } from "react";

type Props = {
  urls: {
    src: string;
    type: string;
  }[];
  posterSrcList: string[];
  className?: string;
};

type NavigatorWithConnection = Navigator & {
  connection?: {
    effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
    saveData?: boolean;
  };
  mozConnection?: {
    effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
    saveData?: boolean;
  };
  webkitConnection?: {
    effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
    saveData?: boolean;
  };
  deviceMemory?: number;
};

const SLOW_CONNECTION_TYPES = new Set(["slow-2g", "2g", "3g"]);

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
