module call::connected {
    use sui::event;
    use std::ascii::String;
    use gateway::gateway::Gateway;
    use sui::tx_context;
    use sui::coin::Coin;

    public entry fun deposit<T>(
        gateway: &mut Gateway,
        coin: Coin<T>,
        receiver: String,
        ctx: &mut tx_context::TxContext
    ) {
        gateway.deposit(coin, receiver, ctx);
    }

    public entry fun deposit_and_call<T>(
        gateway: &mut Gateway,
        coin: Coin<T>,
        receiver: String,
        payload: vector<u8>,
        ctx: &mut tx_context::TxContext
    ) {
        gateway.deposit_and_call(coin, receiver, payload, ctx);
    }
}
