// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.26;

import "@zetachain/toolkit/contracts/testing/FoundrySetup.t.sol";
import "../contracts/Universal.sol";
import {RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";

contract UniversalTest is FoundrySetup {
    Universal public universal;
    string public message = "Alice";

    function setUp() public override {
        super.setUp();
        universal = new Universal(
            payable(address(zetaSetup.wrapGatewayZEVM()))
        );
        // console.log("Custody",  evmSetup.wrapGatewayEVM(5).custody());
        // console.log("Connector",  evmSetup.wrapGatewayEVM(5).zetaConnector());
        // console.log("Zeta token",  evmSetup.zetaToken(5));
        // console.log("TSS",  evmSetup.wrapGatewayEVM(5).tssAddress());
    }

    function test_crosschain_call_emitsHelloEvent() public {
        // Simulate call from EVM -> ZetaChain through wrapGatewayZEVM
        bytes memory encodedMessage = abi.encode(message);

        RevertOptions memory revertOptions = RevertOptions({
            abortAddress: address(0),
            callOnRevert: false,
            onRevertGasLimit: 0,
            revertAddress: address(0),
            revertMessage: ""
        });
        // Listen for event on Universal
        vm.expectEmit(true, true, true, true);
        emit Universal.HelloEvent("Hello: ", message);

        evmSetup.wrapGatewayEVM(5).call(
            address(universal),
            encodedMessage,
            revertOptions
        );
    }
}

// Run test with Foundry:
//  forge test --match-path "contracts\examples\hello\test\Universal.t.sol" -vvv

//
