// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.26;

library BytesHelperLib {
    error OffsetOutOfBounds();

    function bytesToAddress(
        bytes calldata data,
        uint256 offset
    ) internal pure returns (address output) {
        bytes memory b = data[offset:offset + 20];
        assembly {
            output := mload(add(b, 20))
        }
    }

    function bytesMemoryToAddress(
        bytes memory data,
        uint256 offset
    ) internal pure returns (address output) {
        assembly {
            output := mload(add(add(data, offset), 32))
        }
    }

    function bytesToUint32(
        bytes calldata data,
        uint256 offset
    ) internal pure returns (uint32 output) {
        bytes memory b = data[offset:offset + 4];
        assembly {
            output := mload(add(b, 4))
        }
    }

    function addressToBytes(
        address someAddress
    ) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(someAddress)));
    }

    function bytesToBech32Bytes(
        bytes calldata data,
        uint256 offset
    ) internal pure returns (bytes memory) {
        bytes memory bech32Bytes = new bytes(42);
        for (uint i = 0; i < 42; i++) {
            bech32Bytes[i] = data[i + offset];
        }

        return bech32Bytes;
    }

    function bytesToBool(
        bytes calldata data,
        uint256 offset
    ) internal pure returns (bool) {
        if (offset >= data.length) {
            revert OffsetOutOfBounds();
        }
        return uint8(data[offset]) != 0;
    }
}
