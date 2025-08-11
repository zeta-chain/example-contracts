// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.26;

import "@zetachain/toolkit/contracts/testing/FoundrySetup.t.sol";
import "@zetachain/toolkit/contracts/testing/mock/ERC20Mock.sol";
import "@zetachain/toolkit/contracts/testing/mock/ZRC20Mock.sol";
import "../contracts/Swap.sol";
import {SwapCompanion} from "./SwapCompanion.sol";
import {console} from "forge-std/console.sol";

contract SwapTest is FoundrySetup {
    Swap public swap;
    SwapCompanion public ethCompanion;
    SwapCompanion public bnbCompanion;
    address owner = makeAddr("Owner");

    TokenSetup.TokenInfo public eth_testToken1;
    TokenSetup.TokenInfo public bnb_testToken2;

    function setUp() public override {
        super.setUp();

        deal(owner, 1_000_000 ether);
        vm.startPrank(owner);

        // Deploy Swap
        Swap sImpl = new Swap();
        bytes memory sInitData = abi.encodeWithSelector(
            Swap.initialize.selector,
            payable(address(zetaSetup.wrapGatewayZEVM())),
            zetaSetup.uniswapV2Router(),
            500000,
            owner
        );
        address sProxy = address(new ERC1967Proxy(address(sImpl), sInitData));
        swap = Swap(payable(sProxy));

        ethCompanion = new SwapCompanion(
            payable(address(evmSetup.wrapGatewayEVM(chainIdETH)))
        );
        bnbCompanion = new SwapCompanion(
            payable(address(evmSetup.wrapGatewayEVM(chainIdBNB)))
        );

        vm.stopPrank();

        // Create mock token
        eth_testToken1 = tokenSetup.createToken(
            TokenSetup.Contracts({
                zetaSetup: zetaSetup,
                evmSetup: evmSetup,
                nodeLogicMock: zetaSetup.nodeLogicMock(),
                deployer: deployer,
                tss: tss
            }),
            "ETTK1",
            false,
            chainIdETH,
            18
        );
        nodeLogicMock.setAssetToZRC20(
            chainIdETH,
            eth_testToken1.asset,
            eth_testToken1.zrc20
        );
        nodeLogicMock.setZRC20ToAsset(
            chainIdETH,
            eth_testToken1.zrc20,
            eth_testToken1.asset
        );

        bnb_testToken2 = tokenSetup.createToken(
            TokenSetup.Contracts({
                zetaSetup: zetaSetup,
                evmSetup: evmSetup,
                nodeLogicMock: zetaSetup.nodeLogicMock(),
                deployer: deployer,
                tss: tss
            }),
            "BTK2",
            false,
            chainIdBNB,
            18
        );
        nodeLogicMock.setAssetToZRC20(
            chainIdBNB,
            bnb_testToken2.asset,
            bnb_testToken2.zrc20
        );
        nodeLogicMock.setZRC20ToAsset(
            chainIdBNB,
            bnb_testToken2.zrc20,
            bnb_testToken2.asset
        );

        console.log("eth_testToken1.asset", eth_testToken1.asset);
        console.log("bnb_testToken2.asset", bnb_testToken2.asset);
        zetaSetup.uniswapV2AddLiquidity(
            zetaSetup.uniswapV2Router(),
            zetaSetup.uniswapV2Factory(),
            eth_testToken1.zrc20,
            bnb_testToken2.zrc20,
            deployer,
            100 ether,
            100 ether
        );
    }

    function test_swap_zeta_to_eth() public {
        address alice = makeAddr("Alice");
        address bob = makeAddr("Bob");
        deal(alice, 1 ether);
        ZRC20Mock(bnb_testToken2.zrc20).mint(alice, 100 ether);

        vm.prank(alice);
        ZRC20Mock(bnb_testToken2.zrc20).approve(address(swap), 50 ether);
        vm.prank(alice);
        swap.swap(
            bnb_testToken2.zrc20,
            50 ether,
            eth_testToken1.zrc20,
            abi.encodePacked(bob),
            true
        );
        console.log(
            "Alice balance:",
            ZRC20Mock(bnb_testToken2.zrc20).balanceOf(alice)
        );
        console.log(
            "Bob balance:",
            ERC20Mock(eth_testToken1.asset).balanceOf(bob)
        );
        assertEq(ZRC20Mock(bnb_testToken2.zrc20).balanceOf(alice), 50 ether);
        assertGt(ERC20Mock(eth_testToken1.asset).balanceOf(bob), 5 ether);
    }

    function test_swap_eth_to_bnb() public {
        address alice = makeAddr("Alice");
        address bob = makeAddr("Bob");
        deal(alice, 1 ether);
        ERC20Mock(eth_testToken1.asset).mint(alice, 100 ether);

        vm.prank(alice);
        ERC20Mock(eth_testToken1.asset).approve(
            address(ethCompanion),
            50 ether
        );
        vm.prank(alice);
        ethCompanion.swapERC20(
            address(swap),
            bnb_testToken2.zrc20,
            abi.encodePacked(bob),
            50 ether,
            eth_testToken1.asset,
            true
        );
        // vm.stopPrank();

        console.log(
            "Alice balance:",
            ZRC20Mock(bnb_testToken2.zrc20).balanceOf(alice)
        );
        console.log(
            "Bob balance:",
            ERC20Mock(eth_testToken1.asset).balanceOf(bob)
        );
        assertEq(ZRC20Mock(eth_testToken1.asset).balanceOf(alice), 50 ether);
        assertGt(ERC20Mock(bnb_testToken2.asset).balanceOf(bob), 0);
    }

    function test_swap_eth_to_zeta() public {
        address alice = makeAddr("Alice");
        address bob = makeAddr("Bob");
        deal(alice, 1 ether);
        ERC20Mock(eth_testToken1.asset).mint(alice, 100 ether);

        vm.prank(alice);
        ERC20Mock(eth_testToken1.asset).approve(
            address(ethCompanion),
            50 ether
        );
        vm.prank(alice);
        ethCompanion.swapERC20(
            address(swap),
            bnb_testToken2.zrc20,
            abi.encodePacked(bob),
            50 ether,
            eth_testToken1.asset,
            false
        );
        // vm.stopPrank();

        console.log(
            "Alice balance:",
            ZRC20Mock(bnb_testToken2.zrc20).balanceOf(alice)
        );
        console.log(
            "Bob balance:",
            ERC20Mock(eth_testToken1.asset).balanceOf(bob)
        );
        assertEq(ZRC20Mock(eth_testToken1.asset).balanceOf(alice), 50 ether);
        assertGt(ERC20Mock(bnb_testToken2.zrc20).balanceOf(bob), 0);
    }

    function test_swapNativeGas_eth_to_zeta() public {
        address alice = makeAddr("Alice");
        address bob = makeAddr("Bob");
        deal(alice, 1 ether);

        vm.prank(alice);
        ethCompanion.swapNativeGas{value: 0.1 ether}(
            address(swap),
            bnb_testToken2.zrc20,
            abi.encodePacked(bob),
            false
        );
        // vm.stopPrank();

        console.log("Alice balance:", address(alice).balance);
        console.log(
            "Bob balance:",
            ERC20Mock(bnb_testToken2.zrc20).balanceOf(bob)
        );
        assertEq(address(alice).balance, 0.9 ether);
        assertGt(ERC20Mock(bnb_testToken2.zrc20).balanceOf(bob), 0);
    }

    function test_swapNativeGas_eth_to_bnb() public {
        address alice = makeAddr("Alice");
        address bob = makeAddr("Bob");
        deal(alice, 1 ether);

        vm.prank(alice);
        ethCompanion.swapNativeGas{value: 0.1 ether}(
            address(swap),
            bnb_testToken2.zrc20,
            abi.encodePacked(bob),
            true
        );
        // vm.stopPrank();

        console.log("Alice balance:", address(alice).balance);
        console.log(
            "Bob balance:",
            ERC20Mock(bnb_testToken2.asset).balanceOf(bob)
        );
        assertEq(address(alice).balance, 0.9 ether);
        assertGt(ERC20Mock(bnb_testToken2.asset).balanceOf(bob), 0);
    }

    function test_swapNativeGas_eth_to_native_bnb() public {
        address alice = makeAddr("Alice");
        address bob = makeAddr("Bob");
        deal(alice, 1 ether);

        vm.prank(alice);
        ethCompanion.swapNativeGas{value: 0.1 ether}(
            address(swap),
            bnb_bnb.zrc20,
            abi.encodePacked(bob),
            true
        );
        // vm.stopPrank();

        console.log("Alice balance:", address(alice).balance);
        console.log("Bob balance:", address(bob).balance);
        assertEq(address(alice).balance, 0.9 ether);
        assertGt(address(bob).balance, 0);
    }
}

// forge test --match-path "contracts\examples\swap\test\SwapTest.t.sol" -vvvv
