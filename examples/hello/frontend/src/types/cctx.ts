export interface CrossChainTx {
  cctx_status: {
    created_timestamp: string;
    error_message: string;
    error_message_abort: string;
    error_message_revert: string;
    isAbortRefunded: boolean;
    lastUpdate_timestamp: string;
    status: string;
    status_message: string;
  };
  creator: string;
  inbound_params: {
    amount: string;
    asset: string;
    ballot_index: string;
    coin_type: string;
    confirmation_mode: string;
    finalized_zeta_height: string;
    is_cross_chain_call: boolean;
    observed_external_height: string;
    observed_hash: string;
    sender: string;
    sender_chain_id: string;
    status: string;
    tx_finalization_status: string;
    tx_origin: string;
  };
  index: string;
  outbound_params: Array<{
    amount: string;
    ballot_index: string;
    call_options: {
      gas_limit: string;
      is_arbitrary_call: boolean;
    };
    coin_type: string;
    confirmation_mode: string;
    effective_gas_limit: string;
    effective_gas_price: string;
    gas_limit: string;
    gas_price: string;
    gas_priority_fee: string;
    gas_used: string;
    hash: string;
    observed_external_height: string;
    receiver: string;
    receiver_chainId: string;
    tss_nonce: string;
    tss_pubkey: string;
    tx_finalization_status: string;
  }>;
  protocol_contract_version: string;
  relayed_message: string;
  revert_options: {
    abort_address: string;
    call_on_revert: boolean;
    revert_address: string;
    revert_gas_limit: string;
    revert_message: string;
  };
  zeta_fees: string;
}

export interface CrossChainTxResponse {
  CrossChainTxs: CrossChainTx[];
}

export const crosschainCctxStatus = {
  Aborted: 'Aborted',
  OutboundMined: 'OutboundMined',
  PendingInbound: 'PendingInbound',
  PendingOutbound: 'PendingOutbound',
  PendingRevert: 'PendingRevert',
  Reverted: 'Reverted',
} as const;

export type CrosschainCctxStatus =
  (typeof crosschainCctxStatus)[keyof typeof crosschainCctxStatus];
