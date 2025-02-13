module call::hello_world {
    use std::ascii;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::Coin;
    use gateway::gateway::deposit_impl;

    public entry fun gateway_deposit<T>(
        gateway: &mut gateway::gateway::Gateway,
        coin: Coin<T>,
        receiver: ascii::String,
        ctx: &mut TxContext
    ) {
        deposit_impl(gateway, coin, receiver, ctx);
    }
}
