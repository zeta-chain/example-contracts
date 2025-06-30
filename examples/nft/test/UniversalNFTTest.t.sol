// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.26;

import "../../../FoundrySetup.t.sol";
import "../contracts/ZetaChainUniversalNFT.sol";
import "../contracts/EVMUniversalNFT.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract UniversalNFTTest is FoundrySetup {
    ZetaChainUniversalNFT public zNFT;
    EVMUniversalNFT public ethNFT;
    EVMUniversalNFT public bnbNFT;

    address owner = makeAddr("Owner");

    function setUp() public override {
        super.setUp();
        deal(owner, 1_000_000 ether);
        vm.startPrank(owner);

        // Deploy Zeta NFT
        ZetaChainUniversalNFT zImpl = new ZetaChainUniversalNFT();
        bytes memory zInit = abi.encodeWithSelector(
            ZetaChainUniversalNFT.initialize.selector,
            owner,
            "ZetaNFT",
            "ZNFT",
            payable(address(zetaSetup.wrapGatewayZEVM())),
            500000,
            address(zetaSetup.uniswapV2Router())
        );
        address zProxy = address(new ERC1967Proxy(address(zImpl), zInit));
        zNFT = ZetaChainUniversalNFT(payable(zProxy));

        // Deploy ETH NFT
        EVMUniversalNFT ethImpl = new EVMUniversalNFT();
        bytes memory ethInit = abi.encodeWithSelector(
            EVMUniversalNFT.initialize.selector,
            owner,
            "EthNFT",
            "ENFT",
            payable(address(evmSetup.wrapGatewayEVM(chainIdETH))),
            500000
        );
        address ethProxy = address(new ERC1967Proxy(address(ethImpl), ethInit));
        ethNFT = EVMUniversalNFT(payable(ethProxy));

        // Deploy BNB NFT
        EVMUniversalNFT bnbImpl = new EVMUniversalNFT();
        bytes memory bnbInit = abi.encodeWithSelector(
            EVMUniversalNFT.initialize.selector,
            owner,
            "BnbNFT",
            "BNFT",
            payable(address(evmSetup.wrapGatewayEVM(chainIdBNB))),
            500000
        );
        address bnbProxy = address(new ERC1967Proxy(address(bnbImpl), bnbInit));
        bnbNFT = EVMUniversalNFT(payable(bnbProxy));

        // Connect NFTs
        zNFT.setConnected(eth_eth.zrc20, abi.encodePacked(address(ethNFT)));
        zNFT.setConnected(bnb_bnb.zrc20, abi.encodePacked(address(bnbNFT)));
        ethNFT.setUniversal(address(zNFT));
        bnbNFT.setUniversal(address(zNFT));

        vm.stopPrank();
    }

    function test_mint_and_transfer_eth_to_zeta() public {
        address alice = makeAddr("Alice");
        deal(alice, 1 ether);
        vm.startPrank(owner);
        uint256 tokenId = ethNFT.safeMint(alice, "ipfs://example");
        vm.stopPrank();

        assertEq(ethNFT.ownerOf(tokenId), alice);

        vm.prank(alice);
        ethNFT.transferCrossChain(tokenId, makeAddr("Bob"), address(0));

        assertEq(zNFT.ownerOf(tokenId), makeAddr("Bob"));
        vm.expectRevert();
        ethNFT.ownerOf(tokenId); // Đã bị burn trên ETH
    }

    function test_transfer_zeta_to_eth() public {
        address alice = makeAddr("Alice");
        deal(alice, 1 ether);
        vm.startPrank(owner);
        uint256 tokenId = zNFT.safeMint(alice, "ipfs://zeta");
        vm.stopPrank();

        assertEq(zNFT.ownerOf(tokenId), alice);

        vm.prank(alice);
        zNFT.transferCrossChain{value: 1 ether}(
            tokenId,
            makeAddr("Bob"),
            eth_eth.zrc20
        );
        assertEq(ethNFT.ownerOf(tokenId), makeAddr("Bob"));
        vm.expectRevert();
        zNFT.ownerOf(tokenId); // Đã bị burn trên Zeta
    }

    function test_transfer_bnb_to_eth() public {
        address alice = makeAddr("Alice");
        deal(alice, 1 ether);
        vm.startPrank(owner);
        uint256 tokenId = bnbNFT.safeMint(alice, "ipfs://bnb");
        vm.stopPrank();

        vm.prank(alice);
        bnbNFT.transferCrossChain{value: 1 ether}(
            tokenId,
            makeAddr("Bob"),
            eth_eth.zrc20
        );

        assertEq(ethNFT.ownerOf(tokenId), makeAddr("Bob"));
        vm.expectRevert();
        bnbNFT.ownerOf(tokenId);
    }
}


// forge test --match-path "contracts/examples/nft/test/UniversalNFTTest.t.sol" -vvv
