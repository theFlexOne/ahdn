import { useEffect, useMemo, useState } from 'react'

import FbClientContext from './fbClientContext';
import { fbClient } from '@/lib/facebook'

import type { FacebookSDK } from '@/lib/facebook'
import type { ContextFbClient, FbClientContextValue, FbClientProviderProps } from './fbClient.types';

export function FbClientProvider({ children, initOptions }: FbClientProviderProps) {
  const [sdk, setSdk] = useState<FacebookSDK | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (!initOptions.appId) {
        setError(new Error('Facebook appId is missing'));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const initializedSdk = await fbClient.getSDK(initOptions);
        if (!isMounted) return;
        setSdk(initializedSdk);
      } catch (unknownError) {
        if (!isMounted) return;
        const normalizedError =
          unknownError instanceof Error
            ? unknownError
            : new Error('Unknown error while initializing Facebook SDK');
        setError(normalizedError);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [initOptions.appId, initOptions.version, initOptions.xfbml]);

  const contextClient = useMemo<ContextFbClient>(
    () => ({
      getSDK: () => fbClient.getSDK(initOptions),
    }),
    [initOptions.appId, initOptions.version, initOptions.xfbml]
  );

  const value = useMemo<FbClientContextValue>(
    () => ({
      fbClient: contextClient,
      sdk,
      isReady: sdk !== null,
      isLoading,
      error,
    }),
    [contextClient, sdk, isLoading, error]
  );

  return <FbClientContext.Provider value={value}>{children}</FbClientContext.Provider>;
}
