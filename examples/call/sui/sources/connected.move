module connected::connected;

use connected::cetusmock::{GlobalConfig, Partner, Pool, Clock, swap_a2b};
use gateway::gateway::Gateway;
use std::ascii::String;
use sui::address::from_bytes;
use sui::coin::Coin;
use sui::event;
use sui::tx_context;

// Withdraw and Call Example

public entry fun on_call<SOURCE_COIN, TARGET_COIN>(
    in_coins: Coin<SOURCE_COIN>,
    cetus_config: &GlobalConfig,
    pool: &mut Pool<SOURCE_COIN, TARGET_COIN>,
    cetus_partner: &mut Partner,
    clock: &Clock,
    data: vector<u8>,
    ctx: &mut TxContext,
) {
    let coins_out = swap_a2b<SOURCE_COIN, TARGET_COIN>(
        cetus_config,
        pool,
        cetus_partner,
        in_coins,
        clock,
        ctx,
    );

    let receiver = decode_receiver(data);

    // transfer the coins to the provided address
    transfer::public_transfer(coins_out, receiver)
}

fun decode_receiver(data: vector<u8>): address {
    from_bytes(data)
}

// Deposit and Call Example

public entry fun deposit<T>(
    gateway: &mut Gateway,
    coin: Coin<T>,
    receiver: String,
    ctx: &mut tx_context::TxContext,
) {
    gateway.deposit(coin, receiver, ctx);
}

public entry fun deposit_and_call<T>(
    gateway: &mut Gateway,
    coin: Coin<T>,
    receiver: String,
    payload: vector<u8>,
    ctx: &mut tx_context::TxContext,
) {
    gateway.deposit_and_call(coin, receiver, payload, ctx);
}
