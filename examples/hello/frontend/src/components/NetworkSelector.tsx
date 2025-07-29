import { useMemo } from 'react';

import { SUPPORTED_CHAINS, type SupportedChain } from '../constants/chains';
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
  // Convert chains to dropdown options
  const options: DropdownOption<SupportedChain>[] = useMemo(
    () =>
      SUPPORTED_CHAINS.map((chain) => ({
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

  const handleSelect = (option: DropdownOption<SupportedChain>) => {
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
