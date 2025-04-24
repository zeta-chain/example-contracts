/// This module provides a mock implementation of the Cetus DEX (Decentralized Exchange) interface
/// for the Sui blockchain. It simulates token swap functionality between two token types.
///
/// The mock implementation includes:
/// - A simulated liquidity pool for token pairs
/// - Basic swap functionality between token A and token B
/// - Shared objects for configuration and state management
///
/// This is used only for testing and development purposes to simulate
/// token swaps without interacting with the actual Cetus protocol.
module connected::cetusmock;

use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};

/// Global configuration object
public struct GlobalConfig has key {
    id: UID,
}

/// Partner object representing a protocol participant
public struct Partner has key {
    id: UID,
}

/// Clock object for time-based operations
public struct Clock has key {
    id: UID,
}

/// Represents a liquidity pool for a pair of tokens (CoinA and CoinB)
/// Holds balances of both tokens that can be swapped
public struct Pool<phantom CoinA, phantom CoinB> has key {
    id: UID,
    balance_a: Balance<CoinA>,
    balance_b: Balance<CoinB>,
}

/// Initializes the mock protocol by creating and sharing all necessary objects
/// Creates a pool for SUI and TOKEN pair
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

/// Deposits tokens into the pool to be available for swaps
/// @param pool The liquidity pool to deposit into
/// @param coin The coin to deposit
public entry fun deposit<CoinA, CoinB>(pool: &mut Pool<CoinA, CoinB>, coin: Coin<CoinB>) {
    balance::join(&mut pool.balance_b, coin.into_balance());
}

/// Simulates a token swap from CoinA to CoinB
/// @param _config Global configuration object
/// @param pool The liquidity pool to swap from
/// @param _partner Partner object
/// @param coin_a The input coin to swap
/// @param _clock Clock object for time-based operations
/// @param ctx Transaction context
/// @return The swapped coins of type CoinB
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
