// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IZRC20} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";
import {SwapHelperLib} from "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import {BytesHelperLib} from "@zetachain/toolkit/contracts/BytesHelperLib.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

import {RevertContext, RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IWZETA.sol";
import {GatewayZEVM} from "@zetachain/protocol-contracts/contracts/zevm/GatewayZEVM.sol";

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract Swap is
    UniversalContract,
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable
{
    address public uniswapRouter;
    GatewayZEVM public gateway;
    uint256 public gasLimit;

    error InvalidAddress();
    error Unauthorized();
    error ApprovalFailed();
    error TransferFailed(string);
    error InsufficientAmount(string);

    event TokenSwap(
        bytes sender,
        bytes indexed recipient,
        address indexed inputToken,
        address indexed targetToken,
        uint256 inputAmount,
        uint256 outputAmount
    );

    modifier onlyGateway() {
        if (msg.sender != address(gateway)) revert Unauthorized();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address payable gatewayAddress,
        address uniswapRouterAddress,
        uint256 gasLimitAmount,
        address owner
    ) external initializer {
        if (gatewayAddress == address(0) || uniswapRouterAddress == address(0))
            revert InvalidAddress();
        __UUPSUpgradeable_init();
        __Ownable_init(owner);
        uniswapRouter = uniswapRouterAddress;
        gateway = GatewayZEVM(gatewayAddress);
        gasLimit = gasLimitAmount;
    }

    struct Params {
        address target;
        bytes to;
        bool withdraw;
    }

    /**
     * @notice Swap tokens from a connected chain to another connected chain or ZetaChain
     */
    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external onlyGateway {
        (address targetToken, bytes memory recipient, bool withdrawFlag) = abi
            .decode(message, (address, bytes, bool));

        (uint256 out, address gasZRC20, uint256 gasFee) = handleGasAndSwap(
            zrc20,
            amount,
            targetToken,
            withdrawFlag
        );
        emit TokenSwap(
            abi.encodePacked(context.sender),
            recipient,
            zrc20,
            targetToken,
            amount,
            out
        );
        withdraw(
            Params({
                target: targetToken,
                to: recipient,
                withdraw: withdrawFlag
            }),
            abi.encodePacked(context.sender),
            gasFee,
            gasZRC20,
            out,
            zrc20
        );
    }

    /**
     * @notice Swap tokens from ZetaChain optionally withdrawing to a connected chain
     */
    function swap(
        address inputToken,
        uint256 amount,
        address targetToken,
        bytes memory recipient,
        bool withdrawFlag
    ) external {
        bool success = IZRC20(inputToken).transferFrom(
            msg.sender,
            address(this),
            amount
        );
        if (!success) {
            revert TransferFailed(
                "Failed to transfer ZRC-20 tokens from the sender to the contract"
            );
        }

        (uint256 out, address gasZRC20, uint256 gasFee) = handleGasAndSwap(
            inputToken,
            amount,
            targetToken,
            withdrawFlag
        );
        emit TokenSwap(
            abi.encodePacked(msg.sender),
            recipient,
            inputToken,
            targetToken,
            amount,
            out
        );
        withdraw(
            Params({
                target: targetToken,
                to: recipient,
                withdraw: withdrawFlag
            }),
            abi.encodePacked(msg.sender),
            gasFee,
            gasZRC20,
            out,
            inputToken
        );
    }

    /**
     * @notice Swaps enough tokens to pay gas fees, then swaps the remainder to the target token
     */
    function handleGasAndSwap(
        address inputToken,
        uint256 amount,
        address targetToken,
        bool withdraw
    ) internal returns (uint256, address, uint256) {
        uint256 inputForGas;
        address gasZRC20;
        uint256 gasFee = 0;
        uint256 swapAmount = amount;

        if (withdraw) {
            (gasZRC20, gasFee) = IZRC20(targetToken).withdrawGasFee();
            uint256 minInput = quoteMinInput(inputToken, targetToken);
            if (amount < minInput) {
                revert InsufficientAmount(
                    "The input amount is less than the min amount required to cover the withdraw gas fee"
                );
            }
            if (gasZRC20 == inputToken) {
                swapAmount = amount - gasFee;
            } else {
                inputForGas = SwapHelperLib.swapTokensForExactTokens(
                    uniswapRouter,
                    inputToken,
                    gasFee,
                    gasZRC20,
                    amount
                );
                swapAmount = amount - inputForGas;
            }
        }

        uint256 out = SwapHelperLib.swapExactTokensForTokens(
            uniswapRouter,
            inputToken,
            swapAmount,
            targetToken,
            0
        );
        return (out, gasZRC20, gasFee);
    }

    /**
     * @notice Transfer tokens to the recipient on ZetaChain or withdraw to a connected chain
     */
    function withdraw(
        Params memory params,
        bytes memory sender,
        uint256 gasFee,
        address gasZRC20,
        uint256 out,
        address inputToken
    ) internal {
        if (params.withdraw) {
            if (gasZRC20 == params.target) {
                if (!IZRC20(gasZRC20).approve(address(gateway), out + gasFee)) {
                    revert ApprovalFailed();
                }
            } else {
                if (!IZRC20(gasZRC20).approve(address(gateway), gasFee)) {
                    revert ApprovalFailed();
                }
                if (!IZRC20(params.target).approve(address(gateway), out)) {
                    revert ApprovalFailed();
                }
            }
            gateway.withdraw(
                abi.encodePacked(params.to),
                out,
                params.target,
                RevertOptions({
                    revertAddress: address(this),
                    callOnRevert: true,
                    abortAddress: address(0),
                    revertMessage: abi.encode(sender, inputToken),
                    onRevertGasLimit: gasLimit
                })
            );
        } else {
            bool success = IWETH9(params.target).transfer(
                address(uint160(bytes20(params.to))),
                out
            );
            if (!success) {
                revert TransferFailed(
                    "Failed to transfer target tokens to the recipient on ZetaChain"
                );
            }
        }
    }

    /**
     * @notice onRevert handles an edge-case when a swap fails when the recipient
     * on the destination chain is a contract that cannot accept tokens.
     */
    function onRevert(RevertContext calldata context) external onlyGateway {
        (bytes memory sender, address zrc20) = abi.decode(
            context.revertMessage,
            (bytes, address)
        );
        (uint256 out, , ) = handleGasAndSwap(
            context.asset,
            context.amount,
            zrc20,
            true
        );

        gateway.withdraw(
            sender,
            out,
            zrc20,
            RevertOptions({
                revertAddress: address(bytes20(sender)),
                callOnRevert: false,
                abortAddress: address(0),
                revertMessage: "",
                onRevertGasLimit: gasLimit
            })
        );
    }

    /**
     * @notice Returns the minimum amount of input tokens required to cover the gas fee for withdrawal
     */
    function quoteMinInput(
        address inputToken,
        address targetToken
    ) public view returns (uint256) {
        (address gasZRC20, uint256 gasFee) = IZRC20(targetToken)
            .withdrawGasFee();

        if (inputToken == gasZRC20) {
            return gasFee;
        }

        address zeta = IUniswapV2Router01(uniswapRouter).WETH();

        address[] memory path;
        if (inputToken == zeta || gasZRC20 == zeta) {
            path = new address[](2);
            path[0] = inputToken;
            path[1] = gasZRC20;
        } else {
            path = new address[](3);
            path[0] = inputToken;
            path[1] = zeta;
            path[2] = gasZRC20;
        }

        uint256[] memory amountsIn = IUniswapV2Router02(uniswapRouter)
            .getAmountsIn(gasFee, path);

        return amountsIn[0];
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
