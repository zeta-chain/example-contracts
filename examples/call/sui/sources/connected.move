module connected::connected;

use connected::cetusmock::{GlobalConfig, Partner, Pool, Clock, swap_a2b};
use std::ascii::{Self, String};
use std::vector;
use sui::address::from_bytes;
use sui::coin::Coin;
use sui::transfer;
use sui::tx_context::TxContext;

/// Withdraw and Call Example
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

    let receiver = from_bytes(data);

    // transfer the coins to the provided address
    transfer::public_transfer(coins_out, receiver)
}

public fun hello(name: String): String {
    let mut out = b"hello ";

    let name_bytes = ascii::into_bytes(name);

    vector::append(&mut out, name_bytes);

    ascii::string(out)
}
