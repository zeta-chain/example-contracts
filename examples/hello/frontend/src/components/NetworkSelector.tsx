import { useMemo } from 'react';

import { SUPPORTED_CHAINS, type SupportedChain } from '../constants/chains';
import { USE_DYNAMIC_WALLET } from '../constants/wallets';
import { useUnisatWallet } from '../context/UnisatWalletProvider';
import { Dropdown, type DropdownOption } from './Dropdown';

interface NetworkSelectorProps {
  selectedChain?: SupportedChain;
  onNetworkSelect?: (chain: SupportedChain) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const NetworkSelector = ({
  selectedChain,
  onNetworkSelect,
  placeholder = 'Select Network',
  disabled = false,
  className = '',
}: NetworkSelectorProps) => {
  const { connect: connectUnisatWallet, switchChain: switchUnisatChain } =
    useUnisatWallet();

  // Convert chains to dropdown options
  const options: DropdownOption<SupportedChain>[] = useMemo(
    () =>
      SUPPORTED_CHAINS.filter((chain) => {
        if (USE_DYNAMIC_WALLET) {
          return chain.chainType === 'EVM' || chain.chainType === 'SOL';
        } else {
          return chain.chainType === 'EVM' || chain.chainType === 'BTC';
        }
      }).map((chain) => ({
        id: chain.chainId,
        label: chain.name,
        value: chain,
        icon: <img src={chain.icon} alt={chain.name} />,
        colorHex: chain.colorHex,
      })),
    []
  );

  // Find the selected option based on the selected chain
  const selectedOption = useMemo(
    () =>
      selectedChain
        ? options.find(
            (option) => option.value.chainId === selectedChain.chainId
          )
        : undefined,
    [selectedChain, options]
  );

  const handleSelect = async (option: DropdownOption<SupportedChain>) => {
    if (option.value.chainType === 'BTC') {
      try {
        await connectUnisatWallet();
        await switchUnisatChain('BITCOIN_SIGNET');
      } catch (error) {
        console.error('Failed to connect/switch Unisat wallet:', error);
        return; // Don't update selection if connection failed
      }
    }

    onNetworkSelect?.(option.value);
  };

  return (
    <Dropdown
      options={options}
      selectedOption={selectedOption}
      onSelect={handleSelect}
      placeholder={placeholder}
      disabled={disabled}
      className={`network-selector ${className}`}
    />
  );
};
