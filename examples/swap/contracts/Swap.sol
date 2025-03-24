// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {SystemContract, IZRC20} from "@zetachain/toolkit/contracts/SystemContract.sol";
import {SwapHelperLib} from "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import {BytesHelperLib} from "@zetachain/toolkit/contracts/BytesHelperLib.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";

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
    address public wzeta;
    GatewayZEVM public gateway;
    uint256 constant BITCOIN = 8332;
    uint256 constant BITCOIN_TESTNET = 18334;
    uint256 public gasLimit;
    uint24 public constant POOL_FEE = 3000; // 0.3% fee tier

    error InvalidAddress();
    error Unauthorized();
    error ApprovalFailed();
    error TransferFailed(string);
    error InsufficientAmount(string);

    event TokenSwap(
        address sender,
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
        address owner,
        address wzetaAddress
    ) public initializer {
        if (
            gatewayAddress == address(0) ||
            uniswapRouterAddress == address(0) ||
            wzetaAddress == address(0)
        ) revert InvalidAddress();
        __UUPSUpgradeable_init();
        __Ownable_init(owner);
        uniswapRouter = uniswapRouterAddress;
        wzeta = wzetaAddress;
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
        Params memory params = Params({
            target: address(0),
            to: bytes(""),
            withdraw: true
        });

        if (context.chainID == BITCOIN_TESTNET || context.chainID == BITCOIN) {
            params.target = BytesHelperLib.bytesToAddress(message, 0);
            params.to = abi.encodePacked(
                BytesHelperLib.bytesToAddress(message, 20)
            );
            if (message.length >= 41) {
                params.withdraw = BytesHelperLib.bytesToBool(message, 40);
            }
        } else {
            (
                address targetToken,
                bytes memory recipient,
                bool withdrawFlag
            ) = abi.decode(message, (address, bytes, bool));
            params.target = targetToken;
            params.to = recipient;
            params.withdraw = withdrawFlag;
        }

        (uint256 out, address gasZRC20, uint256 gasFee) = handleGasAndSwap(
            zrc20,
            amount,
            params.target,
            params.withdraw
        );
        emit TokenSwap(
            context.sender,
            params.to,
            zrc20,
            params.target,
            amount,
            out
        );
        withdraw(params, context.sender, gasFee, gasZRC20, out, zrc20);
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
    ) public {
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
            msg.sender,
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
            msg.sender,
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
            if (gasZRC20 == inputToken) {
                if (amount < gasFee) {
                    revert InsufficientAmount(
                        "The input amount is less than the gas fee required for withdrawal"
                    );
                }
                swapAmount = amount - gasFee;
            } else {
                inputForGas = swapTokensForExactTokens(
                    inputToken,
                    gasFee,
                    gasZRC20
                );
                if (amount < inputForGas) {
                    revert InsufficientAmount(
                        "The input amount is less than the amount required to cover the gas fee"
                    );
                }
                swapAmount = amount - inputForGas;
            }
        }

        uint256 out = swapExactTokensForTokens(
            inputToken,
            swapAmount,
            targetToken
        );
        return (out, gasZRC20, gasFee);
    }

    /**
     * @notice Swap exact tokens for tokens using Uniswap V3
     */
    function swapExactTokensForTokens(
        address inputToken,
        uint256 amountIn,
        address outputToken
    ) internal returns (uint256) {
        // Approve router to spend input tokens
        IERC20(inputToken).approve(uniswapRouter, amountIn);

        // Try direct swap first
        try
            ISwapRouter(uniswapRouter).exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: inputToken,
                    tokenOut: outputToken,
                    fee: POOL_FEE,
                    recipient: address(this),
                    deadline: block.timestamp + 15 minutes,
                    amountIn: amountIn,
                    amountOutMinimum: 0, // Let Uniswap handle slippage
                    sqrtPriceLimitX96: 0
                })
            )
        returns (uint256 amountOut) {
            return amountOut;
        } catch {
            // If direct swap fails, try through WZETA
            // First swap: inputToken -> WZETA
            uint256 wzetaAmount = ISwapRouter(uniswapRouter).exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: inputToken,
                    tokenOut: wzeta,
                    fee: POOL_FEE,
                    recipient: address(this),
                    deadline: block.timestamp + 15 minutes,
                    amountIn: amountIn,
                    amountOutMinimum: 0, // Let Uniswap handle slippage
                    sqrtPriceLimitX96: 0
                })
            );

            // Approve router to spend WZETA
            IERC20(wzeta).approve(uniswapRouter, wzetaAmount);

            // Second swap: WZETA -> outputToken
            return
                ISwapRouter(uniswapRouter).exactInputSingle(
                    ISwapRouter.ExactInputSingleParams({
                        tokenIn: wzeta,
                        tokenOut: outputToken,
                        fee: POOL_FEE,
                        recipient: address(this),
                        deadline: block.timestamp + 15 minutes,
                        amountIn: wzetaAmount,
                        amountOutMinimum: 0, // Let Uniswap handle slippage
                        sqrtPriceLimitX96: 0
                    })
                );
        }
    }

    /**
     * @notice Swap tokens for exact tokens using Uniswap V3
     */
    function swapTokensForExactTokens(
        address inputToken,
        uint256 amountOut,
        address outputToken
    ) internal returns (uint256) {
        // Approve router to spend input tokens
        IERC20(inputToken).approve(uniswapRouter, type(uint256).max);

        // Try direct swap first
        try
            ISwapRouter(uniswapRouter).exactOutputSingle(
                ISwapRouter.ExactOutputSingleParams({
                    tokenIn: inputToken,
                    tokenOut: outputToken,
                    fee: POOL_FEE,
                    recipient: address(this),
                    deadline: block.timestamp + 15 minutes,
                    amountOut: amountOut,
                    amountInMaximum: type(uint256).max, // Let Uniswap handle slippage
                    sqrtPriceLimitX96: 0
                })
            )
        returns (uint256 amountIn) {
            return amountIn;
        } catch {
            // If direct swap fails, try through WZETA
            // First swap: inputToken -> WZETA
            uint256 wzetaAmount = ISwapRouter(uniswapRouter).exactOutputSingle(
                ISwapRouter.ExactOutputSingleParams({
                    tokenIn: inputToken,
                    tokenOut: wzeta,
                    fee: POOL_FEE,
                    recipient: address(this),
                    deadline: block.timestamp + 15 minutes,
                    amountOut: amountOut,
                    amountInMaximum: type(uint256).max, // Let Uniswap handle slippage
                    sqrtPriceLimitX96: 0
                })
            );

            // Approve router to spend WZETA
            IERC20(wzeta).approve(uniswapRouter, wzetaAmount);

            // Second swap: WZETA -> outputToken
            return
                ISwapRouter(uniswapRouter).exactOutputSingle(
                    ISwapRouter.ExactOutputSingleParams({
                        tokenIn: wzeta,
                        tokenOut: outputToken,
                        fee: POOL_FEE,
                        recipient: address(this),
                        deadline: block.timestamp + 15 minutes,
                        amountOut: amountOut,
                        amountInMaximum: type(uint256).max, // Let Uniswap handle slippage
                        sqrtPriceLimitX96: 0
                    })
                );
        }
    }

    /**
     * @notice Transfer tokens to the recipient on ZetaChain or withdraw to a connected chain
     */
    function withdraw(
        Params memory params,
        address sender,
        uint256 gasFee,
        address gasZRC20,
        uint256 out,
        address inputToken
    ) public {
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
        (address sender, address zrc20) = abi.decode(
            context.revertMessage,
            (address, address)
        );
        (uint256 out, , ) = handleGasAndSwap(
            context.asset,
            context.amount,
            zrc20,
            true
        );

        gateway.withdraw(
            abi.encodePacked(sender),
            out,
            zrc20,
            RevertOptions({
                revertAddress: sender,
                callOnRevert: false,
                abortAddress: address(0),
                revertMessage: "",
                onRevertGasLimit: gasLimit
            })
        );
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
