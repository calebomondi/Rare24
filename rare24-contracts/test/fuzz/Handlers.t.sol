// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {Rare24} from "../../src/Rare24.sol";
import {NftMarketplace} from "../../src/userActivities/NftMarketplace.sol";

contract Handler is Test {
    Rare24 rare24;
    NftMarketplace nftMarket;

    // Track state
    address[] public users;
    address[] public creators;
    uint256 public tokenCount;
    uint256 public mintCount;
    uint256 public buyOfferCount;
    mapping(string => bool) private hasCreated;

    // Track function calls for debugging
    uint256 public calls_makeBuyOffers;
    uint256 public calls_uploadNfts;
    uint256 public calls_mintNfts;

    // Constants
    uint256 private constant MAX_BALANCE = type(uint96).max;
    uint256 private constant MAX_OFFER = 1 ether;
    uint256 private constant MIN_OFFER = 0.1 ether;

    constructor(Rare24 _rare24, NftMarketplace _nftMarket) {
        rare24 = _rare24;
        nftMarket = _nftMarket;

        // Create some test users
        for (uint256 i = 0; i < 10; i++) {
            users.push(address(uint160(i + 1)));
        }
        // Create some test creators
        for (uint256 i = 10; i < 20; i++) {
            creators.push(address(uint160(i + 1)));
        }
    }

    // uploadNft
    function uploadNft(uint creatorSeed, uint maxSupply) public {
        calls_uploadNfts++;

        address creator = creators[creatorSeed % creators.length];
        string memory creator_ = "creator";
        maxSupply = bound(maxSupply, 1, 20);

        if (hasCreated[creator_]) return;

        vm.deal(creator, MAX_OFFER);

        vm.startPrank(creator);
        rare24.uploadNft("", MIN_OFFER, maxSupply, creator_, "", new address[](0));
        tokenCount++;
        hasCreated[creator_] = true;
        vm.stopPrank();
    }

    // mint
    function mintNft(uint userSeed, uint256 tokenSeed) public {
        calls_mintNfts++;

        if (tokenCount == 0) return;

        address user = users[userSeed % users.length];
        uint256 tokenId = bound(tokenSeed, 1, tokenCount);
        string memory _user = "user";

        if (rare24.s_hasMinted(tokenId, user)) return;

        vm.deal(user, MAX_OFFER);

        vm.startPrank(user);
        try rare24.mintPhoto{value: MIN_OFFER}(tokenId, _user) {
            mintCount++;
        } catch {
            //
        }
        vm.stopPrank();
    }

    // make offer
    function makebuyOffer(
        uint256 buyerSeed,
        uint256 tokenSeed,
        uint256 amountSeed,
        uint256 price
    ) public {
        calls_makeBuyOffers++;
        string memory _buyer = "buyer";

        if (tokenCount == 0) return;

        uint256 tokenId = bound(tokenSeed, 1, tokenCount);
        address buyer = users[buyerSeed % users.length];
        uint256 amount = bound(amountSeed, 1, 5);
        price = bound(price, MIN_OFFER, MAX_OFFER);

        vm.deal(buyer, MAX_OFFER);

        vm.startPrank(buyer);
        try
            nftMarket.makeBuyOffer{value: (price * amount)}(
                _buyer,
                tokenId,
                amount,
                price,
                ""
            )
        {
            buyOfferCount++;
        } catch {
            //
        }
        vm.stopPrank();
    }

    // get users
    function getUsers() public view returns (address[] memory) {
        return users;
    }

    // get token count
    function getTokenCount() public view returns (uint256) {
        return tokenCount;
    }

    // summary
    function callSummary() external view {
        console.log("------- Call Summary -------");
        console.log("calls_uploadNfts:     ", calls_uploadNfts);
        console.log("calls_mintNfts:     ", calls_mintNfts);
        console.log("calls_makeBuyOffers:     ", calls_makeBuyOffers);
        console.log("----------------------------");
        console.log("uploads:   ", tokenCount);
        console.log("mints:   ", mintCount);
        console.log("buyOffers:   ", buyOfferCount);
    }
}
