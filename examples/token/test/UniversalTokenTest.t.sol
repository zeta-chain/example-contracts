// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.26;

import "@zetachain/toolkit/contracts/testing/FoundrySetup.t.sol";
import "../contracts/ZetaChainUniversalToken.sol";
import "../contracts/EVMUniversalToken.sol" as EVMUniversalTokenTest;
import {RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract UniversalTokenTest is FoundrySetup {
    ZetaChainUniversalToken public zToken;
    EVMUniversalTokenTest.EVMUniversalToken public ethToken;
    EVMUniversalTokenTest.EVMUniversalToken public bnbToken;
    address owner = makeAddr("Owner");

    function setUp() public override {
        super.setUp();

        deal(owner, 1_000_000 ether);
        // Zetachain setup
        vm.startPrank(owner);
        ZetaChainUniversalToken impl = new ZetaChainUniversalToken();
        bytes memory initData = abi.encodeWithSelector(
            ZetaChainUniversalToken.initialize.selector,
            owner,
            "TestToken",
            "TTK",
            payable(address(zetaSetup.wrapGatewayZEVM())),
            500000,
            address(zetaSetup.uniswapV2Router())
        );
        address proxy = address(
            new ERC1967Proxy(
                address(impl),
                initData
            )
        );
        zToken = ZetaChainUniversalToken(payable(proxy));

        // Ethereum Setup
        EVMUniversalTokenTest.EVMUniversalToken ethImpl = new EVMUniversalTokenTest.EVMUniversalToken();
        bytes memory ethInitData = abi.encodeWithSelector(
            EVMUniversalTokenTest.EVMUniversalToken.initialize.selector,
            owner,
            "TestEthToken",
            "TET",
            payable(address(evmSetup.wrapGatewayEVM(chainIdETH))),
            500000
        );
        address ethProxy = address(
            new ERC1967Proxy(
                address(ethImpl),
                ethInitData
            )
        );
        ethToken = EVMUniversalTokenTest.EVMUniversalToken(payable(ethProxy));

        // BNB Setup
        EVMUniversalTokenTest.EVMUniversalToken bnbImpl = new EVMUniversalTokenTest.EVMUniversalToken();
        bytes memory bnbInitData = abi.encodeWithSelector(
            EVMUniversalTokenTest.EVMUniversalToken.initialize.selector,
            owner,
            "TestBnbToken",
            "TBT",
            payable(address(evmSetup.wrapGatewayEVM(chainIdBNB))),
            500000
        );
        address bnbProxy = address(
            new ERC1967Proxy(
                address(bnbImpl),
                bnbInitData
            )
        );
        bnbToken = EVMUniversalTokenTest.EVMUniversalToken(payable(bnbProxy));
        
        zToken.setConnected(eth_eth.zrc20, abi.encodePacked(address(ethToken)));
        zToken.setConnected(bnb_bnb.zrc20, abi.encodePacked(address(bnbToken)));
        ethToken.setUniversal(address(zToken));
        bnbToken.setUniversal(address(zToken));

        vm.stopPrank();
    }

    function test_transfer_eth_to_zeta() public {
        address alice = makeAddr("Alice");
        address bob = makeAddr("Bob");
        vm.deal(alice, 100 ether);
        vm.prank(owner);
        ethToken.mint(alice, 100 ether);
        console.log("Alice ETH balance:", ethToken.balanceOf(alice));

        vm.prank(alice);
        ethToken.transferCrossChain(
            address(0),
            bob,
            50 ether
        );
        console.log("Alice ETH balance after transfer:", ethToken.balanceOf(alice));
        console.log("Bob ETH balance after transfer:", zToken.balanceOf(bob));

        assertEq(ethToken.balanceOf(alice), 50 ether);
        assertEq(zToken.balanceOf(bob), 50 ether);
    }

    function test_transfer_zeta_to_eth() public {
        address alice = makeAddr("Alice");
        address bob = makeAddr("Bob");
        vm.deal(alice, 100 ether);
        vm.prank(owner);
        zToken.mint(alice, 100 ether);
        console.log("Alice Zeta balance:", zToken.balanceOf(alice));

        vm.prank(alice);
        zToken.transferCrossChain{value: 1 ether}(
            eth_eth.zrc20,
            bob,
            50 ether
        );
        console.log("Alice Zeta balance after transfer:", zToken.balanceOf(alice));
        console.log("Bob Zeta balance after transfer:", ethToken.balanceOf(bob));

        assertEq(zToken.balanceOf(alice), 50 ether);
        assertEq(ethToken.balanceOf(bob), 50 ether);
    }

    function test_transfer_bnb_to_eth() public {
        address alice = makeAddr("Alice");
        address bob = makeAddr("Bob");
        vm.deal(alice, 100 ether);
        vm.prank(owner);
        bnbToken.mint(alice, 100 ether);
        console.log("Alice BNB balance:", bnbToken.balanceOf(alice));

        vm.prank(alice);
        bnbToken.transferCrossChain{value: 1 ether}(
            eth_eth.zrc20,
            bob,
            50 ether
        );
       
        console.log("Alice BNB balance after transfer:", bnbToken.balanceOf(alice));
        console.log("Bob ETH balance after transfer:", ethToken.balanceOf(bob));

        assertEq(bnbToken.balanceOf(alice), 50 ether);
        assertEq(ethToken.balanceOf(bob), 50 ether);
    }
}


// forge test --match-path "contracts/examples/token/test/UniversalTokenTest.t.sol" -vvv
