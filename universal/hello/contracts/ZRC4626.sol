// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {RevertContext, RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC4626.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "hardhat/console.sol";
// import "@zetachain/toolkit/contracts/SwapHelperLib.sol";

contract ZRC4626 is ERC20, IERC4626, UniversalContract {
    using Math for uint256;
    event HelloEvent(string, string);

    event ContextDataRevert(RevertContext);

    address constant _GATEWAY_ADDRESS =
        0x610178dA211FEF7D417bC0e6FeD39F05609AD788;
    IERC20 private immutable _asset;
    uint8 private immutable _decimals;

    /**
     * @dev Set the underlying asset contract. This must be an ERC20-compatible contract (ERC20 or ERC777).
     */
    constructor(
        string memory name_,
        string memory symbol_,
        IERC20 asset_
    ) ERC20(name_, symbol_) {
        (bool success, uint8 assetDecimals) = _tryGetAssetDecimals(asset_);
        _decimals = success ? assetDecimals : super.decimals();
        _asset = asset_;
    }

    struct Params {
        address target;
        bytes to;
    }

    function onCrossChainCall(
        zContext calldata context, // has the address of the sender and of the originating chain ID
        address zrc20, // this is the zrc20 that corresponds to the gas token of the incoming deposit (e.g. zrc20 ETH)
        uint256 amount, // the amount that was deposited
        bytes calldata incomingMessage // in this case this is the address of the contract to call, converted to bytes
    ) external override {
        string memory decodedMessage;
        if (incomingMessage.length > 0) {
            decodedMessage = abi.decode(incomingMessage, (string));
        }
        emit HelloEvent("Hello from a universal app", decodedMessage);
        // if (isDeposit) {
        // Deposit - USDC coming from Ethereum (e.g.), going to BSC via Zeta
        // IZRC20(zrc20).approve(_GATEWAY_ADDRESS, 1_000_000_000); // approve gateway to spend on my behalf to cover gas, I think?
        // uint256 gasLimit = 1_000_000_000;
        // bytes memory recipient = incomingMessage;

        // // Step 1: Generate the function selector
        // // Function signature: depositIntoVault(uint256)
        // bytes4 functionSelector = bytes4(
        //     keccak256(bytes("depositIntoVault(uint256)"))
        // );
        // // Step 2: ABI-encode the arguments
        // uint256 outgoingAmount = 2000000; // 2 USDC
        // bytes memory encodedArgs = abi.encode(outgoingAmount);
        // // Step 3: Combine the function selector and ABI-encoded arguments
        // bytes memory outgoingMessage = abi.encodePacked(
        //     functionSelector,
        //     encodedArgs
        // );

        // RevertOptions memory revertOptions = RevertOptions(
        //     address(this),
        //     false,
        //     address(this),
        //     bytes("revert message")
        // );

        // IGatewayZEVM(_GATEWAY_ADDRESS).call(
        //     recipient, // this contains the recipient smart contract address
        //     zrc20, // this is used as an identifier of which chain to call
        //     outgoingMessage, // this is the function call for depositIntoVault(uint256 amount) in VaultManager
        //     gasLimit,
        //     revertOptions
        // );
        // the call part from the depositAndCall above will prompt a call to BSC to get assets amount
        // wrap the below in _convertToShares(// need to call destination chain);
        // maybe these next two can be combined into one
        // uint256 shares = call(bsc_dummy_vault_address, zrc20_address_eth_bsc, bytes calldata message, uint256 gasLimit, RevertOptions calldata revertOptions)
        //this next call is correct - we are withdrawing from Zeta to the target chain
        // need to swap USDC.ETH to USDC.BSC
        // swapAndWithdraw(zrc20, amount, params.target, params.to);

        // withdrawAndCall(bsc_dummy_vault_address, usdc_address, zrc20_address_eth_bsc, bytes calldata message, uint256 gasLimit, RevertOptions calldata revertOptions);
        // the call here is a call to our dummy vault to deposit into Aave

        // } else if (withdrawal part 1) {
        //     // Withdraw - USDC coming from BSC (e.g.), going to Ethereum via Zeta
        //     //
        //     // this next part would be done by our UI to the Ethereum Gateway
        //     call(address receiver, bytes calldata payload, RevertOptions calldata revertOptions)
        //     //
        //     // the call above will prompt a call from here to BSC to get the asset amount based on shares
        //     uint256 amount = call(bytes memory receiver, address zrc20, bytes calldata message, uint256 gasLimit, RevertOptions calldata revertOptions)
        //     // this call prompts our contract on BSC to initiate the withdrawal and then send a deposit back this way

        // } else if (withdrawal part 2) { // i'm not sure this is necessary, as the first part of the conditional can maybe handle it?
        //     uint256 assets = call(bytes memory receiver, address zrc20, bytes calldata message, uint256 gasLimit, RevertOptions calldata revertOptions)
        //     uint256 assets = _convertToAssets(// need to call destination chain);
        //     // would need this call here to withdraw from Aave and withdraw fund back to Zeta?
        //     call(bytes memory receiver, address zrc20, bytes calldata message, uint256 gasLimit, RevertOptions calldata revertOptions)
        //     // this last withdraw send the USDC from Zeta back to Ethereum
        //     withdraw(bytes memory receiver, uint256 amount, address zrc20, RevertOptions calldata revertOptions);
        // }
    }

    // function swapAndWithdraw(
    //     address inputToken,
    //     uint256 amount,
    //     address targetToken,
    //     bytes memory recipient
    // ) internal {
    //     uint256 inputForGas;
    //     address gasZRC20;
    //     uint256 gasFee;

    //     (gasZRC20, gasFee) = IZRC20(targetToken).withdrawGasFee();

    //     inputForGas = SwapHelperLib.swapTokensForExactTokens(
    //         systemContract,
    //         inputToken,
    //         gasFee,
    //         gasZRC20,
    //         amount
    //     );

    //     uint256 outputAmount = SwapHelperLib.swapExactTokensForTokens(
    //         systemContract,
    //         inputToken,
    //         amount - inputForGas,
    //         targetToken,
    //         0
    //     );

    //     IZRC20(gasZRC20).approve(targetToken, gasFee);
    //     IZRC20(targetToken).withdraw(recipient, outputAmount); // in final version, switch to the withdrawand call
    //     // IZRC20(targetToken).withdrawAndCall(recipient, outputAmount, gasZRC20, bytes("function selector & abi encoded arguments"), 0, RevertOptions(false));
    // }

    function callFromZetaChain(
        bytes memory receiver,
        address zrc20,
        bytes calldata message,
        uint256 gasLimit,
        RevertOptions memory revertOptions
    ) external {
        IZRC20(zrc20).approve(_GATEWAY_ADDRESS, 1_000_000_000);
        IGatewayZEVM(_GATEWAY_ADDRESS).call(
            receiver,
            zrc20,
            message,
            gasLimit,
            revertOptions
        );
    }

    function onRevert(RevertContext calldata revertContext) external override {
        emit ContextDataRevert(revertContext);
    }

    /**
     * @dev Attempts to fetch the asset decimals. A return value of false indicates that the attempt failed in some way.
     */
    function _tryGetAssetDecimals(
        IERC20 asset_
    ) private view returns (bool, uint8) {
        (bool success, bytes memory encodedDecimals) = address(asset_)
            .staticcall(
                abi.encodeWithSelector(IERC20Metadata.decimals.selector)
            );
        if (success && encodedDecimals.length >= 32) {
            uint256 returnedDecimals = abi.decode(encodedDecimals, (uint256));
            if (returnedDecimals <= type(uint8).max) {
                return (true, uint8(returnedDecimals));
            }
        }
        return (false, 0);
    }

    /**
     * @dev Decimals are read from the underlying asset in the constructor and cached. If this fails (e.g., the asset
     * has not been created yet), the cached value is set to a default obtained by `super.decimals()` (which depends on
     * inheritance but is most likely 18). Override this function in order to set a guaranteed hardcoded value.
     * See {IERC20Metadata-decimals}.
     */
    function decimals()
        public
        view
        virtual
        override(IERC20Metadata, ERC20)
        returns (uint8)
    {
        return _decimals;
    }

    /** @dev See {IERC4626-asset}. */
    function asset() public view virtual override returns (address) {
        // return address of asset on target chain?
        return address(_asset);
    }

    /** @dev See {IERC4626-totalAssets}. */
    function totalAssets() public view virtual override returns (uint256) {
        // make call to target chain to get total assets
        return _asset.balanceOf(address(this));
    }

    /** @dev See {IERC4626-convertToShares}. */
    function convertToShares(
        uint256 assets
    ) public view virtual override returns (uint256 shares) {
        return _convertToShares(assets, Math.Rounding.Floor);
    }

    /** @dev See {IERC4626-convertToAssets}. */
    function convertToAssets(
        uint256 shares
    ) public view virtual override returns (uint256 assets) {
        return _convertToAssets(shares, Math.Rounding.Floor);
    }

    /** @dev See {IERC4626-maxDeposit}. */
    function maxDeposit(
        address
    ) public view virtual override returns (uint256) {
        return _isVaultCollateralized() ? type(uint256).max : 0;
    }

    /** @dev See {IERC4626-maxMint}. */
    function maxMint(address) public view virtual override returns (uint256) {
        return type(uint256).max;
    }

    /** @dev See {IERC4626-maxWithdraw}. */
    function maxWithdraw(
        address owner
    ) public view virtual override returns (uint256) {
        return _convertToAssets(balanceOf(owner), Math.Rounding.Floor);
    }

    /** @dev See {IERC4626-maxRedeem}. */
    function maxRedeem(
        address owner
    ) public view virtual override returns (uint256) {
        return balanceOf(owner);
    }

    /** @dev See {IERC4626-previewDeposit}. */
    function previewDeposit(
        uint256 assets
    ) public view virtual override returns (uint256) {
        return _convertToShares(assets, Math.Rounding.Floor);
    }

    /** @dev See {IERC4626-previewMint}. */
    function previewMint(
        uint256 shares
    ) public view virtual override returns (uint256) {
        return _convertToAssets(shares, Math.Rounding.Ceil);
    }

    /** @dev See {IERC4626-previewWithdraw}. */
    function previewWithdraw(
        uint256 assets
    ) public view virtual override returns (uint256) {
        return _convertToShares(assets, Math.Rounding.Ceil);
    }

    /** @dev See {IERC4626-previewRedeem}. */
    function previewRedeem(
        uint256 shares
    ) public view virtual override returns (uint256) {
        return _convertToAssets(shares, Math.Rounding.Floor);
    }

    /** @dev See {IERC4626-deposit}. */
    function deposit(
        uint256 assets,
        address receiver
    ) public virtual override returns (uint256) {
        require(
            assets <= maxDeposit(receiver),
            "ERC4626: deposit more than max"
        );

        uint256 shares = previewDeposit(assets);
        _deposit(_msgSender(), receiver, assets, shares);

        return shares;
    }

    /** @dev See {IERC4626-mint}.
     *
     * As opposed to {deposit}, minting is allowed even if the vault is in a state where the price of a share is zero.
     * In this case, the shares will be minted without requiring any assets to be deposited.
     */
    function mint(
        uint256 shares,
        address receiver
    ) public virtual override returns (uint256) {
        require(shares <= maxMint(receiver), "ERC4626: mint more than max");

        uint256 assets = previewMint(shares);
        _deposit(_msgSender(), receiver, assets, shares);

        return assets;
    }

    /** @dev See {IERC4626-withdraw}. */
    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) public virtual override returns (uint256) {
        require(
            assets <= maxWithdraw(owner),
            "ERC4626: withdraw more than max"
        );

        uint256 shares = previewWithdraw(assets);
        _withdraw(_msgSender(), receiver, owner, assets, shares);

        return shares;
    }

    /** @dev See {IERC4626-redeem}. */
    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) public virtual override returns (uint256) {
        require(shares <= maxRedeem(owner), "ERC4626: redeem more than max");

        uint256 assets = previewRedeem(shares);
        _withdraw(_msgSender(), receiver, owner, assets, shares);

        return assets;
    }

    /**
     * @dev Internal conversion function (from assets to shares) with support for rounding direction.
     *
     * Will revert if assets > 0, totalSupply > 0 and totalAssets = 0. That corresponds to a case where any asset
     * would represent an infinite amount of shares.
     */
    function _convertToShares(
        uint256 assets,
        Math.Rounding rounding
    ) internal view virtual returns (uint256 shares) {
        uint256 supply = totalSupply();
        return
            (assets == 0 || supply == 0)
                ? _initialConvertToShares(assets, rounding)
                : assets.mulDiv(supply, totalAssets(), rounding);
    }

    /**
     * @dev Internal conversion function (from assets to shares) to apply when the vault is empty.
     *
     * NOTE: Make sure to keep this function consistent with {_initialConvertToAssets} when overriding it.
     */
    function _initialConvertToShares(
        uint256 assets,
        Math.Rounding /*rounding*/
    ) internal view virtual returns (uint256 shares) {
        return assets;
    }

    /**
     * @dev Internal conversion function (from shares to assets) with support for rounding direction.
     */
    function _convertToAssets(
        uint256 shares,
        Math.Rounding rounding
    ) internal view virtual returns (uint256 assets) {
        uint256 supply = totalSupply();
        return
            (supply == 0)
                ? _initialConvertToAssets(shares, rounding)
                : shares.mulDiv(totalAssets(), supply, rounding);
    }

    /**
     * @dev Internal conversion function (from shares to assets) to apply when the vault is empty.
     *
     * NOTE: Make sure to keep this function consistent with {_initialConvertToShares} when overriding it.
     */
    function _initialConvertToAssets(
        uint256 shares,
        Math.Rounding /*rounding*/
    ) internal view virtual returns (uint256 assets) {
        return shares;
    }

    /**
     * @dev Deposit/mint common workflow.
     */
    function _deposit(
        address caller,
        address receiver,
        uint256 assets,
        uint256 shares
    ) internal virtual {
        // If _asset is ERC777, `transferFrom` can trigger a reenterancy BEFORE the transfer happens through the
        // `tokensToSend` hook. On the other hand, the `tokenReceived` hook, that is triggered after the transfer,
        // calls the vault, which is assumed not malicious.
        //
        // Conclusion: we need to do the transfer before we mint so that any reentrancy would happen before the
        // assets are transferred and before the shares are minted, which is a valid state.
        // slither-disable-next-line reentrancy-no-eth
        SafeERC20.safeTransferFrom(_asset, caller, address(this), assets);
        _mint(receiver, shares);

        emit Deposit(caller, receiver, assets, shares);
    }

    /**
     * @dev Withdraw/redeem common workflow.
     */
    function _withdraw(
        address caller,
        address receiver,
        address owner,
        uint256 assets,
        uint256 shares
    ) internal virtual {
        if (caller != owner) {
            _spendAllowance(owner, caller, shares);
        }

        // If _asset is ERC777, `transfer` can trigger a reentrancy AFTER the transfer happens through the
        // `tokensReceived` hook. On the other hand, the `tokensToSend` hook, that is triggered before the transfer,
        // calls the vault, which is assumed not malicious.
        //
        // Conclusion: we need to do the transfer after the burn so that any reentrancy would happen after the
        // shares are burned and after the assets are transferred, which is a valid state.
        _burn(owner, shares);
        SafeERC20.safeTransfer(_asset, receiver, assets);

        emit Withdraw(caller, receiver, owner, assets, shares);
    }

    /**
     * @dev Checks if vault is "healthy" in the sense of having assets backing the circulating shares.
     */
    function _isVaultCollateralized() private view returns (bool) {
        return totalAssets() > 0 || totalSupply() == 0;
    }
}
