import { EIP6963AnnounceProviderEvent } from './wallet';

declare global {
  interface WindowEventMap {
    'eip6963:announceProvider': EIP6963AnnounceProviderEvent;
    'eip6963:requestProvider': Event;
  }
} 