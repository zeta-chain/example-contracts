// Define the EIP-6963 interfaces according to the spec
interface EIP1193Provider {
  request: (request: {
    method: string;
    params?: unknown[];
  }) => Promise<unknown>;
  on: (event: string, listener: (data: unknown) => void) => void;
  removeListener: (event: string, listener: (data: unknown) => void) => void;
}

interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

export interface EIP6963AnnounceProviderEvent extends CustomEvent {
  detail: EIP6963ProviderDetail;
} 