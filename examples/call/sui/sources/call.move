module call::hello_world {
    use sui::event;

    public struct HelloEvent has copy, drop {
        message: vector<u8>,
    }

    public entry fun hello(
        gateway: &gateway::gateway::Gateway,
        ctx: &mut TxContext
    ) {
        let event = HelloEvent {message: b"Hello, Sui!"};
        event::emit(event);
    }
}
