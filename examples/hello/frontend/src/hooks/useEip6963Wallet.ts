import { useContext } from 'react';

import { Eip6963WalletContext } from '../context/Eip6963WalletContext';

export const useEip6963Wallet = () => useContext(Eip6963WalletContext);
