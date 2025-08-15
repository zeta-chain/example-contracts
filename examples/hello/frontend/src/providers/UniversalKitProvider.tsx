import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { ZetaChainClient } from '@zetachain/toolkit/client';

const ZetaChainClientContext = createContext<ZetaChainClient | null>(null);

export const UniversalKitProvider = ({ children }: { children: ReactNode }) => {
  const client = useMemo(() => new ZetaChainClient({ network: 'testnet' }), []);

  return (
    <ZetaChainClientContext.Provider value={client}>
      {children}
    </ZetaChainClientContext.Provider>
  );
};

export const useZetaChainClient = () => useContext(ZetaChainClientContext);
