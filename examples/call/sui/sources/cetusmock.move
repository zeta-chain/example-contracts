module connected::cetusmock;

use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};

// stub for shared objects
public struct GlobalConfig has key {
    id: UID,
}

public struct Partner has key {
    id: UID,
}

public struct Clock has key {
    id: UID,
}

// simulate swapped tokens
public struct Pool<phantom CoinA, phantom CoinB> has key {
    id: UID,
    balance_a: Balance<CoinA>,
    balance_b: Balance<CoinB>,
}

// share objects
fun init(ctx: &mut TxContext) {
    let global_config = GlobalConfig {
        id: object::new(ctx),
    };
    let pool = Pool<sui::sui::SUI, connected::token::TOKEN> {
        id: object::new(ctx),
        balance_a: balance::zero<sui::sui::SUI>(),
        balance_b: balance::zero<connected::token::TOKEN>(),
    };
    let partner = Partner {
        id: object::new(ctx),
    };
    let clock = Clock {
        id: object::new(ctx),
    };

    transfer::share_object(global_config);
    transfer::share_object(pool);
    transfer::share_object(partner);
    transfer::share_object(clock);
}

// deposit tokens in the pool to be swapped
public entry fun deposit<CoinA, CoinB>(pool: &mut Pool<CoinA, CoinB>, coin: Coin<CoinB>) {
    balance::join(&mut pool.balance_b, coin.into_balance());
}

// simulate cetus swap
public fun swap_a2b<CoinA, CoinB>(
    _config: &GlobalConfig,
    pool: &mut Pool<CoinA, CoinB>,
    _partner: &mut Partner,
    coin_a: Coin<CoinA>,
    _clock: &Clock,
    ctx: &mut TxContext,
): Coin<CoinB> {
    // deposit all coins in
    balance::join(&mut pool.balance_a, coin_a.into_balance());

    // take all the coins out
    let value = pool.balance_b.value();
    let coins_out = coin::take(&mut pool.balance_b, value, ctx);

    coins_out
}
