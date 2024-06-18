// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract Caller {
    address constant tssAddress = 0x8531a5aB847ff5B22D855633C25ED1DA3255247e;
    event DepositSuccess(address, address);
    error DepositFailed();

    function deposit(address universalAppAddress) public payable {
        bytes memory data = abi.encodePacked();

        (bool success, ) = tssAddress.call{value: msg.value, gas: 100000}(data);

        if (success) {
            emit DepositSuccess(msg.sender, universalAppAddress);
        } else {
            revert DepositFailed();
        }
    }
}
