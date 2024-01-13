// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;

import {Test, console2} from "forge-std/Test.sol";
import {MultiOutput} from "../contracts/MultiOutput.sol";

import "@zetachain/toolkit/contracts/BytesHelperLib.sol";

contract MultiOutputTest is Test {
  uint256 constant BITCOIN = 18332;
  MultiOutput multiOutput;

  function setUp() public {
     multiOutput = new MultiOutput(address(this));
  }

  function testParseMessageFromEVM() public {
    address evmAddress = address(0x1234567890123456789012345678901234567890);
    string memory btcAddress = "bc1q2c3xu66javgjpfavgwm32g9wqcz4zsv0ynq77z";
    address[] memory tokens = new address[](2);
    tokens[0] = 0x1234567890123456789012345678901234567891;
    tokens[1] = 0x1234567890123456789012345678901234567892;
    bytes memory tokensBytes = abi.encode(
      tokens[0],
      tokens[1]
    );

    bytes memory message = abi.encode(
      evmAddress,
      bytes(btcAddress),
      tokensBytes
    );
    
    (address evmRecipient, bytes memory btcRecipient, address[] memory destinationTokens) 
      = multiOutput.parseMessage(0, message);

    assertEq(evmRecipient, evmAddress);
    assertEq(string(btcRecipient), btcAddress);

    for (uint256 i = 0; i < destinationTokens.length; i++) {
      assertEq(destinationTokens[i], tokens[i]);
    }

  }

  function testParseMessageFromBitcoin() public {
    address evmAddress = address(0x1234567890123456789012345678901234567890);
    
    address[] memory tokens = new address[](2);
    tokens[0] = 0x1234567890123456789012345678901234567891;
    tokens[1] = 0x1234567890123456789012345678901234567892;

    bytes memory tokensBytes = abi.encodePacked(
      tokens[0],
      tokens[1]
    );
    
    bytes memory message = abi.encodePacked(
      evmAddress,
      tokensBytes
    );
    
    (address evmRecipient, bytes memory btcRecipient, address[] memory destinationTokens) 
      = multiOutput.parseMessage(BITCOIN, message);

    assertEq(evmRecipient, evmAddress);
    assertEq(btcRecipient.length, 0);
    for (uint256 i = 0; i < destinationTokens.length; i++) {
      assertEq(destinationTokens[i], tokens[i]);
    }
  }
}