import { USE_DYNAMIC_WALLET } from './constants/wallets';
import { DynamicAppContent } from './DynamicAppContent';
import { Eip6963AppContent } from './Eip6963AppContent';

export function AppContent() {
  return USE_DYNAMIC_WALLET ? <DynamicAppContent /> : <Eip6963AppContent />;
}
