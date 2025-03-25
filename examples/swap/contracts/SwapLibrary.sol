// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

library SwapLibrary {
    uint24 constant POOL_FEE = 3000; // 0.3% fee tier

    /**
     * @notice Swap exact tokens for tokens using Uniswap V3
     */
    function swapExactTokensForTokens(
        address inputToken,
        uint256 amountIn,
        address outputToken,
        address uniswapRouter,
        address wzeta
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
            // If direct swap fails, try through WZETA using exactInput for multi-hop
            // The path is encoded as (tokenIn, fee, WZETA, fee, tokenOut)
            bytes memory path = abi.encodePacked(
                inputToken,
                POOL_FEE,
                wzeta,
                POOL_FEE,
                outputToken
            );

            ISwapRouter.ExactInputParams memory params = ISwapRouter
                .ExactInputParams({
                    path: path,
                    recipient: address(this),
                    deadline: block.timestamp + 15 minutes,
                    amountIn: amountIn,
                    amountOutMinimum: 0 // Let Uniswap handle slippage
                });

            return ISwapRouter(uniswapRouter).exactInput(params);
        }
    }

    /**
     * @notice Swap tokens for exact tokens using Uniswap V3
     */
    function swapTokensForExactTokens(
        address inputToken,
        uint256 amountOut,
        address outputToken,
        address uniswapRouter,
        address wzeta
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
            // If direct swap fails, try through WZETA using exactOutput for multi-hop
            // The path is encoded as (tokenOut, fee, WZETA, fee, tokenIn) in reverse order
            bytes memory path = abi.encodePacked(
                outputToken,
                POOL_FEE,
                wzeta,
                POOL_FEE,
                inputToken
            );

            ISwapRouter.ExactOutputParams memory params = ISwapRouter
                .ExactOutputParams({
                    path: path,
                    recipient: address(this),
                    deadline: block.timestamp + 15 minutes,
                    amountOut: amountOut,
                    amountInMaximum: type(uint256).max // Let Uniswap handle slippage
                });

            return ISwapRouter(uniswapRouter).exactOutput(params);
        }
    }
}
