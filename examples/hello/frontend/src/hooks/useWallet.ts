import { useContext } from 'react';
import { WalletContext } from '../context/WalletContext';

export const useWallet = () => useContext(WalletContext); 