// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {Rare24} from "../../src/Rare24.sol";
import {NftMarketplace} from "../../src/userActivities/NftMarketplace.sol";
import {DeployRare24} from "../../script/DeployRare24.s.sol";
import {Handler} from "./Handlers.t.sol";
import {StructLibrary} from "../../src/libraries/StructLibrary.sol";

// Invariants:
// - Sum of all active buy offer values < ETH locked in contract
// - For each tokenId: totalMinted ≤ maxSupply

contract Invariants is StdInvariant, Test {
    DeployRare24 deployer;
    Rare24 rare24;
    NftMarketplace nftMarket;
    Handler handler;

    function setUp() external {
        deployer = new DeployRare24();
        (rare24, nftMarket) = deployer.run();

        handler = new Handler(rare24, nftMarket);
        targetContract(address(handler));
    }

    /**
     * @notice Get all buy offers and compare to that locked in contract
     */
    function invariant_protocolLockedEthIsEqualToThatProvidedForBuyOffer() public view {
        // contract balance
        uint256 contractBalance = address(nftMarket).balance;

        // amount lockedin for buy offers
        uint256 totalOffers = nftMarket.getOfferIdCounter();

        // get total amount offered in each buy offer
        StructLibrary.BuyOffer memory offer;
        uint256 totalAmountOffered;

        for (uint256 i = 1; i <= totalOffers; i++) {
            // get offer
            offer = nftMarket.getBuyOffer(i);
            // check if offer is active
            if (offer.status != StructLibrary.OfferStatus.Active) {
                continue;
            }
            // sum of totalAmount offered
            totalAmountOffered += offer.totalOffer;
        }

        console.log("contractBalance: ", contractBalance);
        console.log("totalAmountOffered: ", totalAmountOffered);

        assert(contractBalance == totalAmountOffered);
    }

    /**
     * @notice Get total minted tokens of available tokens to their max supply
     */
    function invariant_totalMintedNeverExceedsMaxSupply() public view {
        uint256 totalTokens = handler.getTokenCount();

        for (uint256 tokenId = 1; tokenId <= totalTokens; tokenId++) {
            StructLibrary.Photo memory photo = rare24.getPhotoDetails(tokenId);

            // Sum all user balances for this token
            uint256 sumOfBalances = 0;
            address[] memory users = handler.getUsers();

            for (uint256 i = 0; i < users.length; i++) {
                sumOfBalances += rare24.balanceOf(users[i], tokenId);
            }

            // Invariant: totalMinted should equal sum of all balances
            assertEq(
                photo.totalMinted,
                sumOfBalances,
                "Total minted doesn't match sum of balances"
            );
        }
    }

    /**
     * @notice For debugging
     */
    // function invariant_callSummary() public view {
    //     handler.callSummary();
    // }
}
