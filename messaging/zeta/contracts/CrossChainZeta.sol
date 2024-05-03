// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/evm/tools/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/evm/interfaces/ZetaInterfaces.sol";
import "@zetachain/protocol-contracts/contracts/evm/Zeta.eth.sol";

contract CrossChainZeta is ZetaInteractor {
    error ErrorTransferringZeta();

    IERC20 internal immutable _zetaToken;

    constructor(address connectorAddress, address zetaTokenAddress) ZetaInteractor(connectorAddress) {
        _zetaToken = IERC20(zetaTokenAddress);
    }

    function sendMessage(uint256 destinationChainId, uint256 zetaValueAndGas) external payable {
        if (!_isValidChainId(destinationChainId))
            revert InvalidDestinationChainId();

        bool success1 = _zetaToken.approve(address(connector), zetaValueAndGas);
        bool success2 = _zetaToken.transferFrom(msg.sender, address(this), zetaValueAndGas);
        if (!(success1 && success2)) revert ErrorTransferringZeta();

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: destinationChainId,
                destinationAddress: interactorsByChainId[destinationChainId],
                destinationGasLimit: 300000,
                message: abi.encode(),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

}
