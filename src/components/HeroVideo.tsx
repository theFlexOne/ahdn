import { useEffect, useMemo, useState } from "react";

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

function hasSlowConnection() {
  const nav = navigator as NavigatorWithConnection;
  const connection = nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
  if (!connection) {
    return false;
  }

  return connection.saveData === true || SLOW_CONNECTION_TYPES.has(connection.effectiveType ?? "");
}

function hasReducedMotionPreference() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function hasLowDeviceMemory() {
  const nav = navigator as NavigatorWithConnection;
  return typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2;
}

async function isSlowByProbe(probeSrc?: string) {
  if (!probeSrc) {
    return false;
  }

  const testUrl = `${probeSrc}${probeSrc.includes("?") ? "&" : "?"}t=${Date.now()}`;
  const start = performance.now();
  try {
    await fetch(testUrl, {
      cache: "no-store",
      mode: "no-cors",
    });
    const durationMs = performance.now() - start;
    return durationMs > 800;
  } catch {
    return true;
  }
}

export default function HeroVideo({ posterSrc, urls, className }: Props) {
  const resolvedUrls = useMemo(() => (Array.isArray(urls) ? urls : [urls]), [urls]);
  const [allowVideo, setAllowVideo] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function detect() {
      if (hasReducedMotionPreference() || hasLowDeviceMemory() || hasSlowConnection()) {
        if (!cancelled) {
          setAllowVideo(false);
        }
        return;
      }

      const nav = navigator as NavigatorWithConnection;
      const hasConnectionApi = Boolean(nav.connection ?? nav.mozConnection ?? nav.webkitConnection);
      if (!hasConnectionApi) {
        const probeSrc = posterSrc ?? resolvedUrls[0]?.src;
        const isSlow = await isSlowByProbe(probeSrc);
        if (!cancelled) {
          setAllowVideo(!isSlow);
        }
        return;
      }

      if (!cancelled) {
        setAllowVideo(true);
      }
    }

    detect();

    return () => {
      cancelled = true;
    };
  }, [posterSrc, resolvedUrls]);

  if (!allowVideo) {
    return posterSrc ? (
      <img src={posterSrc} alt="" aria-hidden="true" className={className} />
    ) : null;
  }

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
      {resolvedUrls.map((url, index) => (
        <source key={index} src={url.src} type={url.type} />
      ))}
    </video>
  );
}
