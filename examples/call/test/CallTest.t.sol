// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.26;

import "@zetachain/toolkit/contracts/testing/FoundrySetup.t.sol";
import {Connected} from "../contracts/Connected.sol";
import {Universal} from "../contracts/Universal.sol";
import {RevertOptions, RevertContext, AbortContext} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import {CallOptions} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";

contract CallTest is FoundrySetup {
    Connected public connected;
    Universal public universal;
    string public message = "Hello Cross Chain";
    uint256 public constant AMOUNT = 1 ether;

    function setUp() public override {
        super.setUp();
        // Deploy both contracts
        connected = new Connected(
            payable(address(evmSetup.wrapGatewayEVM(chainIdETH)))
        );
        universal = new Universal(
            payable(address(zetaSetup.wrapGatewayZEVM()))
        );
        console.log("universal", address(universal));
        console.log("connected", address(connected));
    }

    // Cross Chain Call Tests
    function test_crosschain_evm_to_zeta() public {
        bytes memory encodedMessage = abi.encode(message);
        RevertOptions memory revertOptions = _getDefaultRevertOptions(
            address(connected),
            false,
            address(universal)
        );

        vm.expectEmit(false, false, false, true);
        emit Universal.HelloEvent("Hello on ZetaChain", message);

        // Call through Connected contract
        connected.call(address(universal), encodedMessage, revertOptions);
    }

    function test_crosschain_zeta_to_evm() public {
        bytes memory encodedMessage = abi.encode(message);
        RevertOptions memory revertOptions = _getDefaultRevertOptions(
            address(universal),
            true,
            address(universal)
        );
        address zrc20 = eth_eth.zrc20;

        // Get gas fee
        CallOptions memory callOptions = _getDefaultCallOptions(false);
        (, uint256 gasFee) = IZRC20(zrc20).withdrawGasFeeWithGasLimit(
            callOptions.gasLimit
        );

        // Mint and approve gas fee
        ERC20Mock(zrc20).mint(address(this), gasFee);
        IERC20(zrc20).approve(address(universal), gasFee);

        vm.expectEmit(false, false, false, true);
        emit Connected.HelloEvent("Hello on EVM from onCall()", message);

        // Call through Universal contract
        universal.call(
            abi.encodePacked(address(connected)),
            zrc20,
            encodedMessage,
            callOptions,
            revertOptions
        );
    }

    // Deposit Flow Tests
    function test_deposit_native_from_evm() public {
        RevertOptions memory revertOptions = _getDefaultRevertOptions(
            address(connected),
            true,
            address(universal)
        );

        // Store initial balances
        uint256 initialSenderBalance = address(this).balance;
        uint256 initialReceiverBalance = address(universal).balance;

        connected.deposit{value: AMOUNT}(address(universal), revertOptions);

        // Assert final balances
        assertEq(address(this).balance, initialSenderBalance - AMOUNT);
        assertEq(
            IZRC20(eth_eth.zrc20).balanceOf(address(universal)),
            initialReceiverBalance + AMOUNT
        );
    }

    function test_deposit_erc20_from_evm() public {
        RevertOptions memory revertOptions = _getDefaultRevertOptions(
            address(connected),
            true,
            address(universal)
        );
        address usdc = usdc_eth.asset;
        uint256 amount = 1 * 10 ** 6; // 100 USDC

        // Store initial balances
        uint256 initialSenderBalance = IERC20(usdc).balanceOf(address(this));
        uint256 initialReceiverBalance = IERC20(usdc).balanceOf(
            address(universal)
        );

        // Mint tokens to sender
        ERC20Mock(usdc).mint(address(this), amount);
        IERC20(usdc).approve(address(connected), amount);

        connected.deposit(address(universal), amount, usdc, revertOptions);

        // Assert final balances
        assertEq(IERC20(usdc).balanceOf(address(this)), initialSenderBalance);
        assertEq(
            IZRC20(usdc_eth.zrc20).balanceOf(address(universal)),
            initialReceiverBalance + amount
        );
    }

    // DepositAndCall Flow Tests
    function test_depositAndCall_native_from_evm() public {
        bytes memory encodedMessage = abi.encode(message);
        RevertOptions memory revertOptions = _getDefaultRevertOptions(
            address(connected),
            true,
            address(universal)
        );

        // Store initial balances
        uint256 initialSenderBalance = address(this).balance;
        uint256 initialReceiverBalance = address(universal).balance;

        // Expect events
        vm.expectEmit(false, false, false, true);
        emit Universal.HelloEvent("Hello on ZetaChain", message);

        connected.depositAndCall{value: AMOUNT}(
            address(universal),
            encodedMessage,
            revertOptions
        );

        // Assert final balances
        assertEq(address(this).balance, initialSenderBalance - AMOUNT);
        assertEq(
            IZRC20(eth_eth.zrc20).balanceOf(address(universal)),
            initialReceiverBalance + AMOUNT
        );
    }

    function test_depositAndCall_erc20_from_evm() public {
        bytes memory encodedMessage = abi.encode(message);
        RevertOptions memory revertOptions = _getDefaultRevertOptions(
            address(connected),
            true,
            address(universal)
        );
        address usdc = usdc_eth.asset;
        uint256 amount = 100 * 10 ** 6; // 100 USDC

        // Store initial balances
        uint256 initialSenderBalance = IERC20(usdc).balanceOf(address(this));
        uint256 initialReceiverBalance = IERC20(usdc).balanceOf(
            address(universal)
        );

        // Mint tokens to sender
        ERC20Mock(usdc).mint(address(this), amount);
        IERC20(usdc).approve(address(connected), amount);

        // Expect events
        vm.expectEmit(false, false, false, true);
        emit Universal.HelloEvent("Hello on ZetaChain", message);

        connected.depositAndCall(
            address(universal),
            amount,
            usdc,
            encodedMessage,
            revertOptions
        );

        // Assert final balances
        assertEq(IERC20(usdc).balanceOf(address(this)), initialSenderBalance);
        assertEq(
            IZRC20(usdc_eth.zrc20).balanceOf(address(universal)),
            initialReceiverBalance + amount
        );
    }

    // Withdraw Flow Tests
    function test_withdraw_zrc20_from_zeta() public {
        RevertOptions memory revertOptions = _getDefaultRevertOptions(
            address(universal),
            true,
            address(universal)
        );

        // Get token info
        TokenSetup.TokenInfo memory tokenInfo = eth_eth;
        address zrc20 = tokenInfo.zrc20;
        // Get gas fee for withdraw
        (address gasZRC20, uint256 gasFee) = IZRC20(zrc20).withdrawGasFee();

        // Calculate total amount needed (withdraw amount + gas fee if same token)
        uint256 totalAmount = (zrc20 == gasZRC20) ? AMOUNT + gasFee : AMOUNT;

        // Store initial balance
        uint256 initialBalance;
        if (tokenInfo.isGasToken) {
            initialBalance = address(connected).balance;
        } else {
            initialBalance = IERC20(tokenInfo.asset).balanceOf(
                address(connected)
            );
        }

        // Mint and approve withdraw amount
        ERC20Mock(zrc20).mint(address(this), totalAmount);
        IERC20(zrc20).approve(address(universal), totalAmount);

        // If gas token is different, handle it separately
        if (zrc20 != gasZRC20) {
            ERC20Mock(gasZRC20).mint(address(this), gasFee);
            IERC20(gasZRC20).approve(address(universal), gasFee);
        }

        universal.withdraw(
            abi.encodePacked(address(connected)),
            AMOUNT,
            zrc20,
            revertOptions
        );

        // Assert final balances
        if (tokenInfo.isGasToken) {
            assertEq(address(connected).balance, initialBalance + AMOUNT);
        } else {
            assertEq(
                IERC20(tokenInfo.asset).balanceOf(address(connected)),
                initialBalance + AMOUNT
            );
        }
    }

    function test_withdrawAndCall_zrc20_from_zeta() public {
        bytes memory encodedMessage = abi.encode(message);
        RevertOptions memory revertOptions = _getDefaultRevertOptions(
            address(universal),
            true,
            address(universal)
        );

        // Get token info
        TokenSetup.TokenInfo memory tokenInfo = eth_eth;
        address zrc20 = tokenInfo.zrc20;

        // Get gas fee for withdraw
        CallOptions memory callOptions = _getDefaultCallOptions(false);
        (, uint256 gasFee) = IZRC20(zrc20).withdrawGasFeeWithGasLimit(
            callOptions.gasLimit
        );

        // Calculate total amount needed (withdraw amount + gas fee)
        uint256 totalAmount = AMOUNT + gasFee;

        // Store initial balances
        uint256 initialSenderBalance = IERC20(zrc20).balanceOf(address(this));
        uint256 initialReceiverBalance;
        if (tokenInfo.isGasToken) {
            initialReceiverBalance = address(connected).balance;
        } else {
            initialReceiverBalance = IERC20(tokenInfo.asset).balanceOf(
                address(connected)
            );
        }

        // Mint and approve tokens
        ERC20Mock(zrc20).mint(address(this), totalAmount);
        IERC20(zrc20).approve(address(universal), totalAmount);

        // Expect events
        vm.expectEmit(false, false, false, true);
        emit Connected.HelloEvent("Hello on EVM from onCall()", message);

        universal.withdrawAndCall(
            abi.encodePacked(address(connected)),
            AMOUNT,
            zrc20,
            encodedMessage,
            callOptions,
            revertOptions
        );

        // Assert final balances
        assertEq(IERC20(zrc20).balanceOf(address(this)), 0);
        if (tokenInfo.isGasToken) {
            assertEq(
                address(connected).balance,
                initialReceiverBalance + AMOUNT
            );
        } else {
            assertEq(
                IERC20(tokenInfo.asset).balanceOf(address(connected)),
                initialReceiverBalance + AMOUNT
            );
        }
    }

    // CallNonArbitrary Flow Tests
    function test_arbitrary_call_zrc20_from_zeta() public {
        // Encode function call data for hello(string)
        bytes4 selector = bytes4(keccak256("hello(string)"));
        bytes memory encodedMessage = abi.encode(message);
        bytes memory callData = abi.encodePacked(selector, encodedMessage);

        RevertOptions memory revertOptions = _getDefaultRevertOptions(
            address(universal),
            true,
            address(universal)
        );
        address zrc20 = eth_eth.zrc20;

        // Get gas fee
        CallOptions memory callOptions = _getDefaultCallOptions(true);
        (, uint256 gasFee) = IZRC20(zrc20).withdrawGasFeeWithGasLimit(
            callOptions.gasLimit
        );

        // Mint and approve gas fee
        ERC20Mock(zrc20).mint(address(this), gasFee);
        IERC20(zrc20).approve(address(universal), gasFee);

        vm.expectEmit(false, false, false, true);
        emit Connected.HelloEvent("Hello on EVM", message);

        universal.call(
            abi.encodePacked(address(connected)),
            zrc20,
            callData,
            callOptions,
            revertOptions
        );
    }

    // Revert + Abort Flow Tests
    function test_depositAndCall_erc20_fail_and_revert_on_eth() public {
        // Setup revert options to trigger onRevert on connected contract
        RevertOptions memory revertOptions = _getDefaultRevertOptions(
            address(connected),
            true,
            address(universal)
        );

        address usdc = usdc_eth.asset;
        uint256 amount = AMOUNT * 2;

        // Mint tokens to sender
        ERC20Mock(usdc).mint(address(this), amount);
        IERC20(usdc).approve(address(connected), amount);

        // Use encodePacked instead of encode to cause decode failure in onCall
        bytes memory encodedMessage = abi.encodePacked(message);

        // Expect RevertEvent from connected contract
        vm.expectEmit(false, false, false, false); // dont check for data, just event
        emit Connected.RevertEvent(
            "Revert on EVM",
            RevertContext({
                sender: address(connected),
                asset: usdc,
                amount: amount, // use swapHelperLib to calculate amount
                revertMessage: revertOptions.revertMessage
            })
        );

        connected.depositAndCall(
            address(universal),
            amount,
            usdc,
            encodedMessage,
            revertOptions
        );
    }

    function test_withdrawAndCall_zrc20_fail_and_abort_on_zeta() public {
        RevertOptions memory revertOptions = _getDefaultRevertOptions(
            address(universal),
            false,
            address(universal)
        );
        CallOptions memory callOptions = _getDefaultCallOptions(false);
        address zrc20 = eth_eth.zrc20;

        // Get gas fee and amounts
        (address gasZRC20, uint256 gasFee) = IZRC20(zrc20)
            .withdrawGasFeeWithGasLimit(callOptions.gasLimit);
        uint256 amount = AMOUNT * 2;
        uint256 totalAmount = (zrc20 == gasZRC20) ? amount + gasFee : amount;

        // Mint and approve tokens
        ERC20Mock(zrc20).mint(address(this), totalAmount);
        IERC20(zrc20).approve(address(universal), totalAmount);

        if (zrc20 != gasZRC20) {
            ERC20Mock(gasZRC20).mint(address(this), gasFee);
            IERC20(gasZRC20).approve(address(universal), gasFee);
        }

        vm.expectEmit(false, false, false, true);
        emit Universal.AbortEvent(
            "Abort on ZetaChain",
            AbortContext({
                sender: abi.encode(address(universal)),
                asset: zrc20,
                amount: amount,
                outgoing: true,
                chainID: chainIdETH,
                revertMessage: revertOptions.revertMessage
            })
        );

        universal.withdrawAndCall(
            abi.encodePacked(address(connected)),
            amount,
            zrc20,
            abi.encodePacked(message), // Use encodePacked to cause decode failure
            callOptions,
            revertOptions
        );
    }

    function test_withdrawAndCall_zrc20_fail_and_revert_on_zeta() public {
        RevertOptions memory revertOptions = _getDefaultRevertOptions(
            address(universal),
            true,
            address(universal)
        );
        CallOptions memory callOptions = _getDefaultCallOptions(false);
        address zrc20 = eth_eth.zrc20;

        // Get gas fee and amounts
        (address gasZRC20, uint256 gasFee) = IZRC20(zrc20)
            .withdrawGasFeeWithGasLimit(callOptions.gasLimit);
        uint256 amount = AMOUNT * 2;
        uint256 totalAmount = (zrc20 == gasZRC20) ? amount + gasFee : amount;

        // Mint and approve tokens
        ERC20Mock(zrc20).mint(address(this), totalAmount);
        IERC20(zrc20).approve(address(universal), totalAmount);

        if (zrc20 != gasZRC20) {
            ERC20Mock(gasZRC20).mint(address(this), gasFee);
            IERC20(gasZRC20).approve(address(universal), gasFee);
        }

        vm.expectEmit(false, false, false, true);
        emit Universal.RevertEvent(
            "Revert on ZetaChain",
            RevertContext({
                sender: address(universal),
                asset: zrc20,
                amount: amount,
                revertMessage: revertOptions.revertMessage
            })
        );

        universal.withdrawAndCall(
            abi.encodePacked(address(connected)),
            amount,
            zrc20,
            abi.encodePacked(message), // Use encodePacked to cause decode failure
            callOptions,
            revertOptions
        );
    }

    // Helper Functions

    function _getDefaultRevertOptions(
        address revertAddr,
        bool callOnRevert,
        address onAbort
    ) internal pure returns (RevertOptions memory) {
        return
            RevertOptions({
                abortAddress: onAbort,
                callOnRevert: callOnRevert,
                onRevertGasLimit: 500000,
                revertAddress: revertAddr,
                revertMessage: "Test revert"
            });
    }

    function _getDefaultCallOptions(
        bool isArbitrary
    ) internal pure returns (CallOptions memory) {
        return CallOptions({isArbitraryCall: isArbitrary, gasLimit: 500000});
    }
}

// forge test --match-path "contracts\examples\call\test\CallTest.t.sol" -vvv
