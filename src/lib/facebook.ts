// src/lib/facebook.ts
export type FacebookInitOptions = {
  appId: string;
  version?: string; // e.g. "v25.0"
  xfbml?: boolean;
};

export type FacebookSDK = {
  init: (options: FacebookInitOptions) => void;
};

type ScriptWithLoadedFlag = HTMLScriptElement & {
  _loaded?: boolean;
};

declare global {
  interface Window {
    FB: FacebookSDK;
  }
}

let fbPromise: Promise<FacebookSDK> | null = null;

function loadScriptOnce(src: string, id: string) {
  const existing = document.getElementById(id) as ScriptWithLoadedFlag | null;
  if (existing) {
    // If it already exists, assume it's either loaded or loading
    return new Promise<void>((resolve, reject) => {
      if (existing._loaded) return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("FB SDK failed to load")), {
        once: true,
      });
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script") as ScriptWithLoadedFlag;
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";

    script.addEventListener(
      "load",
      () => {
        script._loaded = true;
        resolve();
      },
      { once: true }
    );

    script.addEventListener("error", () => reject(new Error("FB SDK failed to load")), {
      once: true,
    });

    document.head.appendChild(script);
  });
}

export const fbClient = {
  getSDK(opts: FacebookInitOptions) {
    if (fbPromise) return fbPromise;

    fbPromise = (async () => {
      await loadScriptOnce("https://connect.facebook.net/en_US/sdk.js", "facebook-jssdk");

      if (!window.FB) {
        // Extremely rare, but makes failures explicit ~ according to ChatGPT
        throw new Error("FB SDK loaded but window.FB is unavailable");
      }

      window.FB.init({
        appId: opts.appId,
        version: opts.version ?? "v25.0",
        xfbml: opts.xfbml ?? true,
      });

      return window.FB;
    })();

    return fbPromise;
  },
};
