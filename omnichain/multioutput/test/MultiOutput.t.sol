// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;

import {Test, console2} from "forge-std/Test.sol";
import {MultiOutput} from "../contracts/MultiOutput.sol";

contract MultiOutputTest is Test {
  uint256 constant BITCOIN = 18332;
  MultiOutput multiOutput;

  function setUp() public {
     multiOutput = new MultiOutput(address(this));
  }

  function testParseMessageFromEVM() public {
    address evmAddress = address(0x1234567890123456789012345678901234567890);
    bytes memory message = abi.encode(
      evmAddress,
      "bc1q2c3xu66javgjpfavgwm32g9wqcz4zsv0ynq77z"
    );
    
    (address evmRecipient, bytes memory btcRecipient) = multiOutput.parseMessage(0, message);

    assertEq(evmRecipient, evmAddress);
    assertEq(string(btcRecipient), "bc1q2c3xu66javgjpfavgwm32g9wqcz4zsv0ynq77z");
  }

  function testParseMessageFromEVMWithoutBitcoin() public {
    address evmAddress = address(0x1234567890123456789012345678901234567890);
    bytes memory message = abi.encode(
      evmAddress
    );
    
    (address evmRecipient, ) = multiOutput.parseMessage(0, message);

    assertEq(evmRecipient, evmAddress);
  }

  function testParseMessageFromBitcoin() public {
    address evmAddress = address(0x1234567890123456789012345678901234567890);
    bytes memory message = abi.encodePacked(
      evmAddress
    );
    
    (address evmRecipient, ) = multiOutput.parseMessage(BITCOIN, message);

    assertEq(evmRecipient, evmAddress);

  }

  function testRegisterDestinationToken() public {
    address[] memory registerAddress = new address[](1);
    registerAddress[0] = 0x609A560dBB0d505CA58291cf7161B3639e2CC747;
    multiOutput.registerDestinationToken(registerAddress);
    assertEq(multiOutput.destinationTokens(0), registerAddress[0]);
  }

}