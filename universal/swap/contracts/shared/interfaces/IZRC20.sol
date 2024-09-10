// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title IZRC20
/// @notice Interface for the ZRC20 token contract.
interface IZRC20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);

    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function deposit(address to, uint256 amount) external returns (bool);

    function burn(uint256 amount) external returns (bool);

    function withdraw(bytes memory to, uint256 amount) external returns (bool);

    function withdrawGasFee() external view returns (address, uint256);

    function withdrawGasFeeWithGasLimit(
        uint256 gasLimit
    ) external view returns (address, uint256);

    /// @dev Name is in upper case to maintain compatibility with ZRC20.sol v1
    function PROTOCOL_FLAT_FEE() external view returns (uint256);

    /// @dev Name is in upper case to maintain compatibility with ZRC20.sol v1
    function GAS_LIMIT() external view returns (uint256);

    function setName(string memory newName) external;

    function setSymbol(string memory newSymbol) external;
}

/// @title IZRC20Metadata
/// @notice Interface for the ZRC20 metadata.
interface IZRC20Metadata is IZRC20 {
    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);
}

/// @title ZRC20Events
/// @notice Interface for the ZRC20 events.
interface ZRC20Events {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
    event Deposit(bytes from, address indexed to, uint256 value);
    event Withdrawal(
        address indexed from,
        bytes to,
        uint256 value,
        uint256 gasFee,
        uint256 protocolFlatFee
    );
    event UpdatedSystemContract(address systemContract);
    event UpdatedGateway(address gateway);
    event UpdatedGasLimit(uint256 gasLimit);
    event UpdatedProtocolFlatFee(uint256 protocolFlatFee);
}

/// @dev Coin types for ZRC20. Zeta value should not be used.
enum CoinType {
    Zeta,
    Gas,
    ERC20
}
