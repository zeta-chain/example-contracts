import { useContext } from 'react';

import { DynamicWalletContext } from '../context/DynamicWalletContext';

export const useDynamicWalletHook = () => useContext(DynamicWalletContext);
