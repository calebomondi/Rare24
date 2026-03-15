// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {Rare24} from "../../src/Rare24.sol";
import {NftMarketplace} from "../../src/userActivities/NftMarketplace.sol";
import {StructLibrary} from "../../src/libraries/StructLibrary.sol";
import {ErrorsLibrary} from "../../src/libraries/ErrorsLibrary.sol";

contract NftMarketplaceTest is Test {
    Rare24 private rare24;
    NftMarketplace private nftMarket;

    // Users
    address owner = makeAddr("owner");
    address creator1 = makeAddr("creator1");
    address creator2 = makeAddr("creator2");
    address creator3 = makeAddr("creator3");
    address buyer1 = makeAddr("buyer1");
    address buyer2 = makeAddr("buyer2");
    address buyer3 = makeAddr("buyer3");
    address treasury = makeAddr("treasury");
    string creator_1 = "creator_1";
    string creator_2 = "creator_2";
    string creator_3 = "creator_3";
    string buyer_1 = "buyer_1";
    string buyer_2 = "buyer_2";
    string buyer_3 = "buyer_3";

    // Constants
    uint256 private constant STARTING_BALANCE = 10 ether;
    uint256 private constant MINT_PRICE = 0.1 ether;
    string private constant SAMPLE_URI =
        "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";

    function setUp() public {
        vm.startPrank(owner);
        rare24 = new Rare24(treasury, "");
        nftMarket = new NftMarketplace(payable(address(rare24)));

        // authorize
        rare24.setAuthorizedContract(address(nftMarket), true);
        vm.stopPrank();

        // Fund users
        vm.deal(creator1, STARTING_BALANCE);
        vm.deal(creator2, STARTING_BALANCE);
        vm.deal(buyer1, STARTING_BALANCE);
        vm.deal(buyer2, STARTING_BALANCE);
        vm.deal(buyer3, STARTING_BALANCE);
    }

    /* URI Uploads */

    modifier successfulBuyOffer() {
        // creator 1
        vm.startPrank(creator1);
        address[] memory collaborators = new address[](2);
        collaborators[0] = creator3;
        collaborators[1] = creator2;
        rare24.uploadNft(SAMPLE_URI, MINT_PRICE, 20, creator_1, "", collaborators);
        vm.stopPrank();
        // creator 2
        vm.startPrank(creator2);
        address[] memory collaborators_2 = new address[](1);
        collaborators_2[0] = creator3;
        rare24.uploadNft(SAMPLE_URI, MINT_PRICE, 20, creator_2, "", collaborators_2);
        vm.stopPrank();

        uint256[] memory _tokenIds = new uint256[](2);
        _tokenIds[0] = 1;
        _tokenIds[1] = 2;

        // batch mint buyer 1, C1 & C2
        vm.startPrank(buyer1);
        uint256 amount = 0.2 ether;
        rare24.batchMintPhotos{value: amount}(_tokenIds, buyer_1);
        vm.stopPrank();
        // batch mint buyer 2, C1 & C2
        vm.startPrank(buyer2);
        uint256 _amount = 0.2 ether;
        rare24.batchMintPhotos{value: _amount}(_tokenIds, buyer_2);
        vm.stopPrank();

        // make buy offer
        vm.startPrank(buyer3);
        uint256 amount_ = 1 ether;
        nftMarket.makeBuyOffer{value: (amount_ * 2)}(
            buyer_3,
            1,
            2,
            amount_,
            ""
        );
        vm.stopPrank();

        _;
    }

    modifier successfulListing() {
        // creator 1
        vm.startPrank(creator1);
        address[] memory collaborators = new address[](2);
        collaborators[0] = creator3;
        collaborators[1] = creator2;
        rare24.uploadNft(SAMPLE_URI, MINT_PRICE, 20, creator_1, "", collaborators);
        vm.stopPrank();
        // creator 2
        vm.startPrank(creator2);
        address[] memory collaborators_2 = new address[](1);
        collaborators_2[0] = creator3;
        rare24.uploadNft(SAMPLE_URI, MINT_PRICE, 20, creator_2, "", collaborators_2);
        vm.stopPrank();

        uint256[] memory _tokenIds = new uint256[](2);
        _tokenIds[0] = 1;
        _tokenIds[1] = 2;

        // batch mint buyer 1, C1 & C2
        vm.startPrank(buyer1);
        uint256 amount = 0.2 ether;
        rare24.batchMintPhotos{value: amount}(_tokenIds, buyer_1);
        vm.stopPrank();

        // create listing
        vm.startPrank(buyer1);
        nftMarket.createListing(buyer_1, 1, 1, 1 ether, 7 days);
        vm.stopPrank();

        _;
    }

    /* Make Buy Offer */

    function testRevertIfZeroTokenValuesAreParsed() public {
        vm.startPrank(buyer1);
        // price per token
        vm.expectRevert(
            ErrorsLibrary.NftMarketplace__InvalidPrice.selector
        );
        nftMarket.makeBuyOffer(buyer_1, 1, 1, 0, "");

        // token amount
        vm.expectRevert(
            ErrorsLibrary.NftMarketplace__InvalidAmount.selector
        );
        nftMarket.makeBuyOffer(buyer_1, 1, 0, 1, "");

        // token Id
        vm.expectRevert(
            ErrorsLibrary.NftMarketplace__InvalidTokenId.selector
        );
        nftMarket.makeBuyOffer(buyer_1, 0, 1, 1, "");

        vm.stopPrank();
    }

    function testRevertBuyOfferIfInsuffientEthOffered() public {
        uint256 amount_ = 1 ether;
        
        vm.startPrank(buyer3);
        // less
        vm.expectRevert(ErrorsLibrary.NftMarketplace__InsufficientFunds.selector);
        nftMarket.makeBuyOffer{value: amount_}(buyer_3, 1, 2, amount_, "");

        vm.stopPrank();
    }

    function testRevertBuyOfferIfExcessEthOffered() public {
        uint256 amount_ = 1 ether;
        
        vm.startPrank(buyer3);        
        // excess
        vm.expectRevert(ErrorsLibrary.NftMarketplace__ExcessiveFunds.selector);
        nftMarket.makeBuyOffer{value: (amount_ * 3)}(buyer_3, 1, 2, amount_, "");

        vm.stopPrank();
    }

    function testSuccessFulBuyOffer() public successfulBuyOffer {
        // buy offer
        StructLibrary.BuyOffer memory offer = nftMarket.getBuyOffer(1);

        uint256 _tokenId = 1;
        uint256 totalOffer = 2 ether;

        assertEq(offer.buyerAddress, buyer3);
        assertEq(offer.totalOffer, totalOffer);
        assertEq(offer.tokenId, _tokenId);

        // token and user offers
        uint256[] memory offers = new uint256[](1);
        offers[0] = 1;

        uint256[] memory tokenOffers = nftMarket.getTokenOffers(1);
        uint256[] memory buyerOffers = nftMarket.getUserOffers(buyer_3);

        assertEq(offers, tokenOffers);
        assertEq(offers, buyerOffers);

        // next trade counter
        uint256 expectedOfferId = 1;
        uint256 actualOfferId = nftMarket.getOfferIdCounter();

        assert(expectedOfferId == actualOfferId);
    }

    /* Accept Buy Offer */

    function testRevertIfBuyOfferIsCancelled() public successfulBuyOffer {
        // cancel offer
        vm.prank(buyer3);
        nftMarket.cancelBuyOffer(1);

        // try accept
        vm.startPrank(buyer1);
        vm.expectRevert(ErrorsLibrary.NftMarketplace__OfferNotActive.selector);
        nftMarket.acceptBuyOffer(1, buyer_1);
        vm.stopPrank();
    }

    function testRevertIfOfferExpired() public successfulBuyOffer {
        // cancel offer
        vm.warp(block.timestamp + 10 days);

        // try accept
        vm.startPrank(buyer1);
        vm.expectRevert(ErrorsLibrary.NftMarketplace__OfferExpired.selector);
        nftMarket.acceptBuyOffer(1, buyer_1);
        vm.stopPrank();
    }

    function testRevertIfSellerHasNoToken() public successfulBuyOffer {
        //
        uint256[] memory _tokenIds = new uint256[](1);
        _tokenIds[0] = 1;
        uint256[] memory _value = new uint256[](1);
        _value[0] = 1;

        vm.prank(buyer1);
        rare24.safeBatchTransferFrom(buyer1, buyer2, _tokenIds, _value, "");

        // try accept
        vm.startPrank(buyer1);
        vm.expectRevert(
            ErrorsLibrary.NftMarketplace__SellerDoesNotOwnToken.selector
        );
        nftMarket.acceptBuyOffer(1, buyer_1);
        vm.stopPrank();
    }

    function testSuccessfulAcceptOffer() public successfulBuyOffer {
        // initial balances
        uint256 buyer1BalancesC1 = rare24.balanceOf(buyer1, 1);
        uint256 buyer3BalancesC1 = rare24.balanceOf(buyer3, 1);

        uint256 expectedOne = 1;
        uint256 expectedZero = 0;

        assertEq(buyer1BalancesC1, expectedOne);
        assertEq(buyer3BalancesC1, expectedZero);

        // Accept
        vm.prank(buyer1);
        nftMarket.acceptBuyOffer(1, buyer_1);

        // check
        uint256 expectedrecieved = 1;
        StructLibrary.BuyOffer memory offer = nftMarket.getBuyOffer(1);
        assert(offer.status == StructLibrary.OfferStatus.Active);
        assert(expectedrecieved == offer.received);

        // final balances
        buyer1BalancesC1 = rare24.balanceOf(buyer1, 1);
        buyer3BalancesC1 = rare24.balanceOf(buyer3, 1);

        assertEq(buyer1BalancesC1, expectedZero);
        assertEq(buyer3BalancesC1, expectedOne);

        // last sale price
        uint256 expectedLastPrice = 1 ether;
        uint256 actualLastPrice = nftMarket.getLastSale(offer.tokenId);

        assert(expectedLastPrice == actualLastPrice);        
    }

    function testSuccessfulFundDistributionAfterAcceptOffer()
        public
        successfulBuyOffer
    {
        // initial balances
        uint256 buyer1Balance = buyer1.balance;
        uint256 c1Balance = creator1.balance;
        uint256 c2Balance = creator2.balance;
        uint256 c3Balance = creator3.balance;

        uint256 token1Gains = 0.1 ether / uint256(3);
        uint256 buyer1Gains = 0.85 ether;

        // Accept
        vm.prank(buyer1);
        nftMarket.acceptBuyOffer(1, buyer_1);

        // final balances
        uint256 finalBuyer1Balance = buyer1.balance;
        uint256 finalC1Balance = creator1.balance;
        uint256 finalC2Balance = creator2.balance;
        uint256 finalC3Balance = creator3.balance;

        assertEq(finalBuyer1Balance, buyer1Balance + buyer1Gains);
        assertEq(finalC1Balance, c1Balance + token1Gains + uint256(1));
        assertEq(finalC2Balance, c2Balance + token1Gains);
        assertEq(finalC3Balance, c3Balance + token1Gains);
    }

    function testSuccessfulPlatformRevenue() public successfulBuyOffer {
        // initial balances
        uint256 expectedContractBalances = 120_000_000_000_000_000;
        uint256 contractBalance = address(rare24).balance;

        assertEq(contractBalance, expectedContractBalances);

        //
        uint256 expectedContractGains = 0.05 ether;

        // Accept
        vm.prank(buyer1);
        nftMarket.acceptBuyOffer(1, buyer_1);

        // final balances
        uint256 expectedFinalContractBalances = expectedContractBalances +
            expectedContractGains;
        uint256 finalContractBalance = address(rare24).balance;

        assertEq(expectedFinalContractBalances, finalContractBalance);
    }

    /* Cancel Buy Offer */

    function testRevertIfOfferStatusNotActive() public successfulBuyOffer {
        // buyer1 accepts offer
        vm.prank(buyer1);
        nftMarket.acceptBuyOffer(1, buyer_1);

        // buyer2 accepts offer
        vm.prank(buyer2);
        nftMarket.acceptBuyOffer(1, buyer_2);

        // try cancel
        vm.startPrank(buyer3);
        vm.expectRevert(ErrorsLibrary.NftMarketplace__OfferNotActive.selector);
        nftMarket.cancelBuyOffer(1);
        vm.stopPrank();
    }

    function testRevertCancelIfNotBuyer() public successfulBuyOffer {
        // try cancel
        vm.startPrank(buyer2);
        vm.expectRevert(ErrorsLibrary.NftMarketplace__NotTokenBuyer.selector);
        nftMarket.cancelBuyOffer(1);
        vm.stopPrank();
    }

    function testSuccessfulCancelOffer() public successfulBuyOffer {
        // initial balances
        uint256 buyer3Balance = buyer3.balance;
        uint256 contractBalance = address(nftMarket).balance;

        uint256 change = 2 ether;

        // cancel
        vm.prank(buyer3);
        nftMarket.cancelBuyOffer(1);

        // final balances
        uint256 finalBuyer3Balance = buyer3.balance;
        uint256 finalContractBalance = address(nftMarket).balance;

        assertEq(finalBuyer3Balance, buyer3Balance + change);
        assertEq(finalContractBalance, contractBalance - change);

        // check status
        StructLibrary.BuyOffer memory offer = nftMarket.getBuyOffer(1);
        assert(offer.status == StructLibrary.OfferStatus.Cancelled);
    }

    /* Refund Buy offer */

    function testRevertIfOfferStillActive() public successfulBuyOffer {
        //
        vm.startPrank(buyer3);
        vm.expectRevert(
            ErrorsLibrary.NftMarketplace__OfferStillActive.selector
        );
        nftMarket.refundBuyOffer(1);
        vm.stopPrank();
    }

    function testRevertRefundIfNotBuyer() public successfulBuyOffer {
        // forward time
        vm.warp(block.timestamp + 10 days);

        // try refund
        vm.startPrank(buyer2);
        vm.expectRevert(ErrorsLibrary.NftMarketplace__NotTokenBuyer.selector);
        nftMarket.refundBuyOffer(1);
        vm.stopPrank();
    }

    function testRevertRefundIfOfferFulfilled() public successfulBuyOffer {
        // Accept
        vm.prank(buyer1);
        nftMarket.acceptBuyOffer(1, buyer_1);

        // Accept
        vm.prank(buyer2);
        nftMarket.acceptBuyOffer(1, buyer_2);

        vm.warp(block.timestamp + 8 days);

        // try refund
        vm.startPrank(buyer3);
        vm.expectRevert(ErrorsLibrary.NftMarketplace__OfferedFullfiled.selector);
        nftMarket.refundBuyOffer(1);
        vm.stopPrank();
    }

    function testSuccessfulRefundOffer() public successfulBuyOffer {
        // initial balances
        uint256 buyer3Balance = buyer3.balance;
        uint256 contractBalance = address(nftMarket).balance;

        uint256 change = 2 ether;

        // forward time
        vm.warp(block.timestamp + 10 days);

        // cancel
        vm.prank(buyer3);
        nftMarket.refundBuyOffer(1);

        // final balances
        uint256 finalBuyer3Balance = buyer3.balance;
        uint256 finalContractBalance = address(nftMarket).balance;

        assertEq(finalBuyer3Balance, buyer3Balance + change);
        assertEq(finalContractBalance, contractBalance - change);

        // check status
        StructLibrary.BuyOffer memory offer = nftMarket.getBuyOffer(1);
        assert(offer.status == StructLibrary.OfferStatus.Expired);
    }

    /* Create Listing */

    function testRevertCreateListings() public {
        // upload NFT
        // creator 2
        vm.startPrank(creator2);
        rare24.uploadNft(SAMPLE_URI, MINT_PRICE, 20, creator_2, "", new address[](0));
        vm.stopPrank();        

        vm.startPrank(buyer1);
        // mint
        rare24.mintPhoto{value: MINT_PRICE}(1, buyer_1);

        // token Id
        vm.expectRevert(
            ErrorsLibrary.NftMarketplace__InvalidTokenId.selector
        );
        nftMarket.createListing(buyer_1, 0, 1, 1 ether, 7 days);

        // token amount
        vm.expectRevert(
            ErrorsLibrary.NftMarketplace__InvalidAmount.selector
        );
        nftMarket.createListing(buyer_1, 1, 0, 1 ether, 7 days);

        // price per token
        vm.expectRevert(
            ErrorsLibrary.NftMarketplace__InvalidPrice.selector
        );
        nftMarket.createListing(buyer_1, 1, 1, 0, 7 days);

        // duration
        vm.expectRevert(
            ErrorsLibrary.NftMarketplace__InvalidTime.selector
        );
        nftMarket.createListing(buyer_1, 1, 1, 1 ether, 6 days);

        vm.stopPrank();
    }

    function testRevertCreateListingOnZeroBalance() public {
        vm.startPrank(buyer1);
        vm.expectRevert(
            ErrorsLibrary.NftMarketplace__SellerDoesNotOwnToken.selector
        );
        nftMarket.createListing(buyer_1, 1, 1, 1 ether, 7 days);
        vm.stopPrank();
    }

    function testSuccessfulListing() public successfulListing {
        //
        uint256 tokenId = 1;
        uint256 latestListingId = nftMarket.getListingIdCounter();
        StructLibrary.SellListing memory listing = nftMarket.getSaleListing(1);

        assert(latestListingId == listing.listingId);
        assert(tokenId == listing.tokenId);

        // token and user offers
        uint256[] memory listings = new uint256[](1);
        listings[0] = 1;

        uint256[] memory tokenListings = nftMarket.getTokenListings(1);
        uint256[] memory userListings = nftMarket.getUsersListings(buyer_1);

        assertEq(listings, tokenListings);
        assertEq(listings, userListings);     
    }

    /* Cancel Listing */

    function testRevertCancelListingIfNotActive() public successfulListing {
        // buy listing
        vm.prank(buyer3);
        nftMarket.buyListing{value: 1 ether}(1, buyer_3);

        // try cancelling
        vm.startPrank(buyer1);
        vm.expectRevert(
            ErrorsLibrary.NftMarketplace__ListingNotActive.selector
        );
        nftMarket.cancelListing(1);
        vm.stopPrank();
    }

    function testRevertCancelIfNotLister() public successfulListing {
         // try cancelling
        vm.startPrank(buyer3);
        vm.expectRevert(
            ErrorsLibrary.NftMarketplace__NotTokenSeller.selector
        );
        nftMarket.cancelListing(1);
        vm.stopPrank();
    }

    function testSuccesfulCancelListing() public successfulListing {
        // cancel
        vm.prank(buyer1);
        nftMarket.cancelListing(1);

        // check
        StructLibrary.SellListing memory listing = nftMarket.getSaleListing(1);
        assert(StructLibrary.ListingStatus.Cancelled == listing.status);
    }

    /* Update Listing Price */

    function testRevertUpdateListingIfNotActive() public successfulListing {
        // buy listing
        vm.prank(buyer3);
        nftMarket.buyListing{value: 1 ether}(1, buyer_3);

        // try updating
        vm.startPrank(buyer1);
        vm.expectRevert(
            ErrorsLibrary.NftMarketplace__ListingNotActive.selector
        );
        nftMarket.updateListingPrice(1, 1 ether);
        vm.stopPrank();
    }

    function testRevertUpdateIfNotLister() public successfulListing {
        // try updating
        vm.startPrank(buyer3);
        vm.expectRevert(
            ErrorsLibrary.NftMarketplace__NotTokenSeller.selector
        );
        nftMarket.updateListingPrice(1, 1 ether);
        vm.stopPrank();
    }

    function testRevertUpdateIfZeroPrice() public successfulListing {
        // try updating
        vm.startPrank(buyer1);
        vm.expectRevert(
            ErrorsLibrary.NftMarketplace__InvalidPrice.selector
        );
        nftMarket.updateListingPrice(1, 0);
        vm.stopPrank();
    }

    function testSuccessfulUpdateListing() public successfulListing {
        //
        StructLibrary.SellListing memory listing = nftMarket.getSaleListing(1);

        uint256 currentListPrice = listing.pricePerToken;
        uint256 expectedCurrentListPrice = 1 ether;

        assert(currentListPrice == expectedCurrentListPrice);

        // update
        uint256 newPrice = 1.5 ether;
        vm.prank(buyer1);
        nftMarket.updateListingPrice(1, newPrice);

        listing = nftMarket.getSaleListing(1);
        currentListPrice = listing.pricePerToken;

        assert(currentListPrice == newPrice);
    }

    /* Buy Listing */

    function testRevertBuyIfListingNotActive() public successfulListing {
        // cancel
        vm.prank(buyer1);
        nftMarket.cancelListing(1);

        // try buying
        vm.startPrank(buyer3);
        vm.expectRevert(
            ErrorsLibrary.NftMarketplace__ListingNotActive.selector
        );
        nftMarket.buyListing{value: 1 ether}(1, buyer_3);
        vm.stopPrank();
    }

    function testRevertBuyIfBuyerIsSeller() public successfulListing {
        // try buying
        vm.startPrank(buyer1);
        vm.expectRevert(
            ErrorsLibrary.NftMarketplace__CannotOfferToSelf.selector
        );
        nftMarket.buyListing{value: 1 ether}(1, buyer_1);
        vm.stopPrank();
    }

    function testRevertBuyIfListingExpired() public successfulListing {
        // forward time
        vm.warp(block.timestamp + 8 days);

        // try buying
        vm.startPrank(buyer3);
        vm.expectRevert(
            ErrorsLibrary.NftMarketplace__ListingExpired.selector
        );
        nftMarket.buyListing{value: 1 ether}(1, buyer_3);
        vm.stopPrank();
    }

    function testRevertBuyIfSellerNotOwnToken() public successfulListing {
        // tranfer token
        vm.prank(address(nftMarket));
        rare24.authorizedSaleTransfer(buyer1, buyer2, 1, 1);

        // try buying
        vm.startPrank(buyer3);
        vm.expectRevert(
            ErrorsLibrary.NftMarketplace__SellerDoesNotOwnToken.selector
        );
        nftMarket.buyListing{value: 1 ether}(1, buyer_3);
        vm.stopPrank();
    }

    function testRevertBuyIfLessOrExcessEthSent() public successfulListing {
        // try buying
        vm.startPrank(buyer3);

        // less
        vm.expectRevert(
            ErrorsLibrary.NftMarketplace__InsufficientFunds.selector
        );
        nftMarket.buyListing{value: 0.7 ether}(1, buyer_3);

        // excess
        vm.expectRevert(
            ErrorsLibrary.NftMarketplace__ExcessiveFunds.selector
        );
        nftMarket.buyListing{value: 1.1 ether}(1, buyer_3);

        vm.stopPrank();
    }

    function testSuccessfulBuyListing() public successfulListing {
        // buy
        vm.startPrank(buyer3);
        nftMarket.buyListing{value: 1 ether}(1, buyer_3);
        vm.stopPrank();

        //
        StructLibrary.SellListing memory listing = nftMarket.getSaleListing(1);
        uint256 sold = 1;
        uint256 lastSale = 1 ether;

        assert(sold == listing.sold);
        assert(lastSale == listing.pricePerToken);
        assert(StructLibrary.ListingStatus.Sold == listing.status);
    }

    function testSuccessfulListingFundDistribution()
        public
        successfulListing
    {
        // initial balances
        uint256 buyer1Balance = buyer1.balance;
        uint256 c1Balance = creator1.balance;
        uint256 c2Balance = creator2.balance;
        uint256 c3Balance = creator3.balance;

        uint256 token1Gains = 0.1 ether / uint256(3);
        uint256 buyer1Gains = 0.85 ether;

        // buy
        vm.prank(buyer3);
        nftMarket.buyListing{value: 1 ether}(1, buyer_3);

        // final balances
        uint256 finalBuyer1Balance = buyer1.balance;
        uint256 finalC1Balance = creator1.balance;
        uint256 finalC2Balance = creator2.balance;
        uint256 finalC3Balance = creator3.balance;

        assertEq(finalBuyer1Balance, buyer1Balance + buyer1Gains);
        assertEq(finalC1Balance, c1Balance + token1Gains + uint256(1));
        assertEq(finalC2Balance, c2Balance + token1Gains);
        assertEq(finalC3Balance, c3Balance + token1Gains);
    }

    function testSuccessfullListingPlatformRevenue() public successfulListing {
        // initial balances
        uint256 expectedContractBalances = 60_000_000_000_000_000;
        uint256 contractBalance = address(rare24).balance;

        assertEq(contractBalance, expectedContractBalances);

        //
        uint256 expectedContractGains = 0.05 ether;

        // buy
        vm.prank(buyer3);
        nftMarket.buyListing{value: 1 ether}(1, buyer_3);

        // final balances
        uint256 expectedFinalContractBalances = expectedContractBalances +
            expectedContractGains;
        uint256 finalContractBalance = address(rare24).balance;

        assertEq(expectedFinalContractBalances, finalContractBalance);
    }
}
