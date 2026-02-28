import type { FacebookInitOptions, FacebookSDK } from "@/lib/facebook";
import type { PropsWithChildren } from "react";

export type FbClientContextValue = {
  fbClient: ContextFbClient;
  sdk: FacebookSDK | null;
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;
};

export type ContextFbClient = {
  getSDK: () => Promise<FacebookSDK>;
};

export type FbClientProviderProps = PropsWithChildren<{
  initOptions: FacebookInitOptions;
}>;
