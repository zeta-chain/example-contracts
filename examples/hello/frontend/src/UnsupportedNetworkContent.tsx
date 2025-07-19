interface UnsupportedNetworkContentProps {
  decimalChainId: number;
}

export function UnsupportedNetworkContent({
  decimalChainId,
}: UnsupportedNetworkContentProps) {
  return (
    <div className="main-container">
      <h1>Unsupported Network</h1>
      <p>
        You are connected to an unsupported network with Chain Id{' '}
        {decimalChainId}.
      </p>
      <p>Please switch to a supported network to continue.</p>
    </div>
  );
}
