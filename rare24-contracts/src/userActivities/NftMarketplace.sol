// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// OZ imports
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/* Local imports */
import {Rare24} from "../Rare24.sol";
import {StructLibrary} from "../libraries/StructLibrary.sol";
import {ErrorsLibrary} from "../libraries/ErrorsLibrary.sol";
import {EventsLibrary} from "../libraries/EventsLibrary.sol";

/**
 * @title NftMarketplace - A contract for managing NFT listings, buy offers, and purchases.
 * @author BlockYard
 * @dev This contract implements a secondary market for Rare24 NFTs with the following features:
 *      - Buy offers: Allow buyers to make offers on specific NFT editions
 *      - Fixed-price listings: Allow sellers to list NFTs for sale at a set price
 *      - Automatic royalty distribution: 10% to creators, 5% to platform, 85% to seller
 *      - Expiration handling: Offers and listings expire after configurable duration
 *      - Reentrancy protection: All state-changing functions are protected
 *
 * @notice This contract facilitates secondary market transactions for Rare24 NFTs.
 *         It handles both buy offers and fixed-price listings, ensuring that original
 *         creators receive royalties on all secondary sales (10% of sale price).
 *         The platform retains a 5% fee on secondary sales.
 *
 * @dev Key architectural decisions:
 *      - Uses counters for offer and listing IDs for tracking
 *      - Royalty: 10% to creators, 5% platform fee, 85% to seller
 *      - Buy offers expire after 7 days if not accepted
 *      - Listings must have minimum duration of 6 days
 *      - Supports batch operations for gas efficiency
 *      - Requires Rare24 contract integration for token transfers
 *
 * @dev Fee distribution formula for secondary sales:
 *      - royalty = saleAmount * 10 / 100 (goes to creators)
 *      - platformFee = saleAmount * 5 / 100 (goes to Rare24 contract)
 *      - sellerProceeds = saleAmount - royalty - platformFee (goes to seller)
 *
 * @dev Integration: This contract must be authorized by Rare24 to execute transfers.
 *      See Rare24.setAuthorizedContract().
 */
contract NftMarketplace is ReentrancyGuard {
    Rare24 public rare24;

    /*
     * STATE VARIABLES
     */
    uint256 private s_offerIdCounter;
    uint256 private s_listingIdCounter;
    uint256 private constant RESALE_ROYALTY = 10; // 10% royalty on resale for creators
    uint256 private constant FEE = 5; // 5% platform fee

    // offerId => BuyOffer
    mapping(uint256 => StructLibrary.BuyOffer) public s_buyOffers;
    // tokenId => array of offerIds
    mapping(uint256 => uint256[]) public s_tokenOffers;
    // user => user buy offers ids
    mapping(string => uint256[]) public s_userOffers;
    // listingId => Listing
    mapping(uint256 => StructLibrary.SellListing) public s_sellListings;
    // tokenId => array of listingIds
    mapping(uint256 => uint256[]) public s_tokenListings;
    // user => user listing ids
    mapping(string => uint256[]) public s_userListings;

    // tokenId => Highest offer
    mapping(uint256 => uint256) public s_highestOffer;
    // tokenId => last sale price
    mapping(uint256 => uint256) public s_lastSale;

    /*
     * CONSTRUCTOR
     */
    constructor(address payable _rare24) {
        rare24 = Rare24(_rare24);
    }

    /*
     * PUBLIC & EXTERNAL FUNCTIONS
     */

    ///////////////////////////////////////
    //////     BUY OFFER OPERATIONS   ////
    /////////////////////////////////////

    /**
     * @notice Creates a buy offer for a specific NFT token.
     * @dev Allows a buyer to make an offer on one or more editions of a token.
     *      Requires exact payment in ETH matching total price (amount * pricePerToken).
     *      Offer remains active for 7 days or until accepted/cancelled/expired.
     *
     * @param buyer The string identifier of the buyer (username)
     * @param _tokenId The unique identifier of the NFT token
     * @param _amount The number of editions to purchase (typically 1)
     * @param _pricePerToken The offer price in Wei per token
     * @param _message Optional message from the buyer to the seller
     *
     * @return The ID of the newly created buy offer
     *
     * Reverts NftMarketplace__InvalidPrice if pricePerToken is zero
     * Reverts NftMarketplace__InvalidAmount if amount is zero
     * Reverts NftMarketplace__InvalidTokenId if tokenId is zero
     * Reverts NftMarketplace__InsufficientFunds if msg.value < total price
     * Reverts NftMarketplace__ExcessiveFunds if msg.value > total price
     *
     * Emits NftMarketplace__BuyOfferCreated with offerId, buyer, tokenId, amount, pricePerToken
     */
    function makeBuyOffer(
        string memory buyer,
        uint256 _tokenId,
        uint256 _amount,
        uint256 _pricePerToken,
        string memory _message
    ) external payable nonReentrant returns (uint256) {
        // validate values
        if (_pricePerToken == 0) {
            revert ErrorsLibrary.NftMarketplace__InvalidPrice();
        }
        if (_amount == 0) {
            revert ErrorsLibrary.NftMarketplace__InvalidAmount();
        }
        if (_tokenId == 0) {
            revert ErrorsLibrary.NftMarketplace__InvalidTokenId();
        }

        // Calculate total price and ensure sufficient payment is sent
        uint256 totalPrice = (_amount * _pricePerToken);
        if (msg.value < totalPrice) {
            revert ErrorsLibrary.NftMarketplace__InsufficientFunds();
        }
        if (msg.value > totalPrice) {
            revert ErrorsLibrary.NftMarketplace__ExcessiveFunds();
        }

        // increment counter
        s_offerIdCounter++;

        // Create Buy Offer
        s_buyOffers[s_offerIdCounter] = StructLibrary.BuyOffer({
            buyerName: buyer,
            offerId: s_offerIdCounter,
            buyerAddress: msg.sender,
            tokenId: _tokenId,
            amount: _amount,
            received: 0,
            offerPerToken: _pricePerToken,
            totalOffer: totalPrice,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + 7 days,
            status: StructLibrary.OfferStatus.Active,
            message: _message
        });

        // Assign offer ID to s_tokenOffers, buyer
        s_tokenOffers[_tokenId].push(s_offerIdCounter);
        s_userOffers[buyer].push(s_offerIdCounter);

        // update highest offer
        if (_pricePerToken > s_highestOffer[_tokenId]) {
            s_highestOffer[_tokenId] = _pricePerToken;
        }

        // Emit event
        emit EventsLibrary.NftMarketplace__BuyOfferCreated(
            s_offerIdCounter,
            msg.sender,
            _tokenId,
            _amount,
            _pricePerToken
        );

        return s_offerIdCounter;
    }

    /**
     * @notice Accepts a buy offer and transfers the NFT to the buyer.
     * @dev Only callable by the token owner. Accepts the offer and transfers ownership.
     *      If multiple editions were offered, partial fulfillment is tracked via 'received'.
     *      NFT is transferred via Rare24.authorizedSaleTransfer().
     *      Funds are distributed: seller (85%), creators (10%), platform (5%).
     *
     * @param _offerId The ID of the buy offer to accept
     * @param seller The string identifier of the seller (username)
     *
     * Reverts NftMarketplace__OfferNotActive if offer is not in Active status
     * Reverts NftMarketplace__OfferExpired if offer has expired
     * Reverts NftMarketplace__SellerDoesNotOwnToken if caller doesn't own the token
     *
     * Emits NftMarketplace__BuyOfferAccepted with tokenId, seller, buyer, price, timestamp
     */
    function acceptBuyOffer(
        uint256 _offerId,
        string memory seller
    ) external nonReentrant {
        StructLibrary.BuyOffer storage offer = s_buyOffers[_offerId];

        // Checks
        if (offer.status != StructLibrary.OfferStatus.Active) {
            revert ErrorsLibrary.NftMarketplace__OfferNotActive();
        }
        if (block.timestamp > offer.expiresAt) {
            revert ErrorsLibrary.NftMarketplace__OfferExpired();
        }
        // Verify seller owns the token
        if (rare24.balanceOf(msg.sender, offer.tokenId) == 0) {
            revert ErrorsLibrary.NftMarketplace__SellerDoesNotOwnToken();
        }

        // Mark offer as accepted
        offer.received++;

        if (offer.received == offer.amount) {
            offer.status = StructLibrary.OfferStatus.Accepted;
        }

        // update last sale
        s_lastSale[offer.tokenId] = offer.offerPerToken;

        // Transfer NFT to buyer
        rare24.authorizedSaleTransfer(
            msg.sender,
            offer.buyerAddress,
            offer.tokenId,
            uint256(1)
        );

        // Distribute resale funds
        _distributeResellFunds(msg.sender, offer.offerPerToken, offer.tokenId);

        // Emit event
        emit EventsLibrary.NftMarketplace__BuyOfferAccepted(
            offer.tokenId,
            seller,
            offer.buyerName,
            offer.offerPerToken,
            uint32(block.timestamp)
        );
    }

    /**
     * @notice Cancels a buy offer and refunds the buyer.
     * @dev Only callable by the original buyer. Cancels an active offer and
     *      refunds the remaining (unfulfilled) portion of the offer amount.
     *
     * @param _offerId The ID of the buy offer to cancel
     *
     * Reverts NftMarketplace__OfferNotActive if offer is not in Active status
     * Reverts NftMarketplace__NotTokenBuyer if caller is not the original buyer
     *
     * Emits NftMarketplace__BuyOfferCancelled with offerId
     */
    function cancelBuyOffer(uint256 _offerId) external {
        StructLibrary.BuyOffer storage offer = s_buyOffers[_offerId];

        // Checks
        if (offer.status != StructLibrary.OfferStatus.Active) {
            revert ErrorsLibrary.NftMarketplace__OfferNotActive();
        }
        if (msg.sender != offer.buyerAddress) {
            revert ErrorsLibrary.NftMarketplace__NotTokenBuyer();
        }

        // get remaining amount
        uint256 remaining = offer.amount - offer.received;

        // Process cancellation and refund amount
        uint256 refundAmount = offer.offerPerToken * remaining;
        offer.status = StructLibrary.OfferStatus.Cancelled;
        // Refund buyer
        (bool success, ) = msg.sender.call{value: refundAmount}("");
        if (!success) {
            revert ErrorsLibrary.NftMarketplace__PaymentFailed();
        }

        // Emit event
        emit EventsLibrary.NftMarketplace__BuyOfferCancelled(_offerId);
    }

    /**
     * @notice Refunds the buyer for an expired buy offer.
     * @dev Only callable by the original buyer after offer expiration.
     *      Refunds any unfulfilled portion of the offer amount.
     *
     * @param _offerId The ID of the buy offer to refund
     *
     * Reverts NftMarketplace__OfferStillActive if offer has not yet expired
     * Reverts NftMarketplace__NotTokenBuyer if caller is not the original buyer
     * Reverts NftMarketplace__OfferedFullfiled if all amounts were already received
     *
     * Emits NftMarketplace__BuyOfferExpired with offerId
     */
    function refundBuyOffer(uint256 _offerId) external nonReentrant {
        StructLibrary.BuyOffer storage offer = s_buyOffers[_offerId];

        // Checks
        if (block.timestamp < offer.expiresAt) {
            revert ErrorsLibrary.NftMarketplace__OfferStillActive();
        }
        if (msg.sender != offer.buyerAddress) {
            revert ErrorsLibrary.NftMarketplace__NotTokenBuyer();
        }
        if (offer.amount == offer.received) {
            revert ErrorsLibrary.NftMarketplace__OfferedFullfiled();
        }

        // get remaining amount
        uint256 remaining = offer.amount - offer.received;

        // Process refund
        uint256 refundAmount = offer.offerPerToken * remaining;
        offer.status = StructLibrary.OfferStatus.Expired;
        // Refund buyer
        (bool success, ) = msg.sender.call{value: refundAmount}("");
        if (!success) {
            revert ErrorsLibrary.NftMarketplace__PaymentFailed();
        }

        // Emit event
        emit EventsLibrary.NftMarketplace__BuyOfferExpired(_offerId);
    }

    ///////////////////////////////////////
    //////     LISTINGS OPERATIONS    ////
    /////////////////////////////////////

    /**
     * @notice Creates a fixed-price listing for an NFT.
     * @dev Lists an NFT for sale at a specified price.
     *      Listing must have a minimum duration of 7 days (6 days + 1 second).
     *      Seller must own at least the amount of tokens being listed.
     *
     * @param seller The string identifier of the seller (username)
     * @param _tokenId The unique identifier of the NFT token
     * @param _amount The number of editions to list for sale
     * @param _pricePerToken The fixed price in Wei per token
     * @param _duration The duration of the listing in seconds (must be > 6 days)
     *
     * @return The ID of the newly created listing
     *
     * Reverts NftMarketplace__InvalidTokenId if tokenId is zero
     * Reverts NftMarketplace__InvalidAmount if amount is zero
     * Reverts NftMarketplace__InvalidPrice if pricePerToken is zero
     * Reverts NftMarketplace__InvalidTime if duration <= 6 days
     * Reverts NftMarketplace__SellerDoesNotOwnToken if seller owns less than amount
     *
     * Emits NftMarketplace__ListingCreated with listingId, seller, tokenId, pricePerToken
     */
    function createListing(
        string memory seller,
        uint256 _tokenId,
        uint256 _amount,
        uint256 _pricePerToken,
        uint256 _duration
    ) external returns (uint256) {
        // validate values
        if (_tokenId == 0) {
            revert ErrorsLibrary.NftMarketplace__InvalidTokenId();
        }
        if (_amount == 0) {
            revert ErrorsLibrary.NftMarketplace__InvalidAmount();
        }
        if (_pricePerToken == 0) {
            revert ErrorsLibrary.NftMarketplace__InvalidPrice();
        }
        if (_duration <= 6 days) {
            revert ErrorsLibrary.NftMarketplace__InvalidTime();
        }
        // Verify ownership
        if (rare24.balanceOf(msg.sender, _tokenId) < _amount) {
            revert ErrorsLibrary.NftMarketplace__SellerDoesNotOwnToken();
        }

        // new Id
        s_listingIdCounter++;
        // create listing
        s_sellListings[s_listingIdCounter] = StructLibrary.SellListing({
            sellerName: seller,
            listingId: s_listingIdCounter,
            sellerAddress: msg.sender,
            tokenId: _tokenId,
            amount: _amount,
            sold: 0,
            pricePerToken: _pricePerToken,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + _duration,
            status: StructLibrary.ListingStatus.Active
        });

        // track listings
        s_tokenListings[_tokenId].push(s_listingIdCounter);
        s_userListings[seller].push(s_listingIdCounter);

        // emit
        emit EventsLibrary.NftMarketplace__ListingCreated(
            s_listingIdCounter,
            msg.sender,
            _tokenId,
            _pricePerToken
        );

        return s_listingIdCounter;
    }

    /**
     * @notice Cancels an active listing.
     * @dev Only callable by the original seller. Sets listing status to Cancelled.
     *
     * @param _listingId The ID of the listing to cancel
     *
     * Reverts NftMarketplace__ListingNotActive if listing is not Active
     * Reverts NftMarketplace__NotTokenSeller if caller is not the original seller
     *
     * Emits NftMarketplace__ListingCancelled with listingId
     */
    function cancelListing(uint256 _listingId) external {
        StructLibrary.SellListing storage listing = s_sellListings[_listingId];

        if (listing.status != StructLibrary.ListingStatus.Active) {
            revert ErrorsLibrary.NftMarketplace__ListingNotActive();
        }
        if (msg.sender != listing.sellerAddress) {
            revert ErrorsLibrary.NftMarketplace__NotTokenSeller();
        }

        // update status
        listing.status = StructLibrary.ListingStatus.Cancelled;

        //emit
        emit EventsLibrary.NftMarketplace__ListingCancelled(_listingId);
    }

    /**
     * @notice Updates the price of an active listing.
     * @dev Only callable by the original seller. Updates pricePerToken.
     *
     * @param _listingId The ID of the listing to update
     * @param _newPrice The new price in Wei per token
     *
     * Reverts NftMarketplace__ListingNotActive if listing is not Active
     * Reverts NftMarketplace__NotTokenSeller if caller is not the original seller
     * Reverts NftMarketplace__InvalidPrice if newPrice is zero
     *
     * Emits NftMarketplace__ListingPriceUpdate with seller, listingId, newPrice
     */
    function updateListingPrice(
        uint256 _listingId,
        uint256 _newPrice
    ) external {
        StructLibrary.SellListing storage listing = s_sellListings[_listingId];

        if (listing.status != StructLibrary.ListingStatus.Active) {
            revert ErrorsLibrary.NftMarketplace__ListingNotActive();
        }
        if (msg.sender != listing.sellerAddress) {
            revert ErrorsLibrary.NftMarketplace__NotTokenSeller();
        }
        if (_newPrice == 0) {
            revert ErrorsLibrary.NftMarketplace__InvalidPrice();
        }

        // update price
        listing.pricePerToken = _newPrice;

        // emit
        emit EventsLibrary.NftMarketplace__ListingPriceUpdate(
            msg.sender,
            _listingId,
            _newPrice
        );
    }

    /**
     * @notice Purchases an NFT from a fixed-price listing.
     * @dev Buys the listed NFT at the asking price.
     *      Requires exact payment matching the listing price.
     *      NFT is transferred via Rare24.authorizedSaleTransfer().
     *      Funds are distributed: seller (85%), creators (10%), platform (5%).
     *
     * @param _listingId The ID of the listing to purchase
     * @param buyer The string identifier of the buyer (username)
     *
     * Reverts NftMarketplace__ListingNotActive if listing is not Active
     * Reverts NftMarketplace__CannotOfferToSelf if buyer is the seller
     * Reverts NftMarketplace__ListingExpired if listing has expired
     * Reverts NftMarketplace__SellerDoesNotOwnToken if seller no longer owns the tokens
     * Reverts NftMarketplace__InsufficientFunds if msg.value < listing price
     * Reverts NftMarketplace__ExcessiveFunds if msg.value > listing price
     *
     * Emits NftMarketplace__ListingPurchased with tokenId, seller, buyer, price, timestamp
     */
    function buyListing(
        uint256 _listingId,
        string memory buyer
    ) external payable nonReentrant {
        StructLibrary.SellListing storage listing = s_sellListings[_listingId];

        if (listing.status != StructLibrary.ListingStatus.Active) {
            revert ErrorsLibrary.NftMarketplace__ListingNotActive();
        }
        if (msg.sender == listing.sellerAddress) {
            revert ErrorsLibrary.NftMarketplace__CannotOfferToSelf();
        }
        if (block.timestamp > listing.expiresAt) {
            revert ErrorsLibrary.NftMarketplace__ListingExpired();
        }

        // Verify ownership
        if (
            rare24.balanceOf(listing.sellerAddress, listing.tokenId) < listing.amount
        ) {
            listing.status = StructLibrary.ListingStatus.Cancelled;
            revert ErrorsLibrary.NftMarketplace__SellerDoesNotOwnToken();
        }

        // check offered amount
        if (msg.value < listing.pricePerToken) {
            revert ErrorsLibrary.NftMarketplace__InsufficientFunds();
        }
        if (msg.value > listing.pricePerToken) {
            revert ErrorsLibrary.NftMarketplace__ExcessiveFunds();
        }

        // Mark listing as sold
        listing.sold++;

        if (listing.sold == listing.amount) {
            listing.status = StructLibrary.ListingStatus.Sold;
        }

        // update last sale
        s_lastSale[listing.tokenId] = listing.pricePerToken;

        // Transfer NFT
        rare24.authorizedSaleTransfer(
            listing.sellerAddress,
            msg.sender,
            listing.tokenId,
            listing.amount
        );

        // Distribute Funds
        _distributeResellFunds(listing.sellerAddress, listing.pricePerToken, listing.tokenId);

        // Emit
        emit EventsLibrary.NftMarketplace__ListingPurchased(
            listing.tokenId,
            listing.sellerName,
            buyer,
            listing.pricePerToken,
            uint32(block.timestamp)
        );
    }

    /*
     * INTERNAL & PRIVATE FUNCTIONS
     */

    /**
     * @dev Distributes funds from a secondary market sale.
     * @param seller The address of the seller
     * @param _amount The sale amount in Wei
     * @param _tokenId The token ID for royalty calculation
     *
     * @dev Distribution formula:
     *      - royalty (10%) = amount * 10 / 100 -> distributed to creators equally
     *      - platformFee (5%) = amount * 5 / 100 -> sent to Rare24 contract
     *      - sellerProceeds = amount - royalty - platformFee -> sent to seller
     *
     * Reverts NftMarketplace__PaymentFailed if any ETH transfer fails
     *
     * Emits NftMarketplace__RoyaltyPaid with tokenId, creators array, royalty amount per creator
     */
    function _distributeResellFunds(
        address seller,
        uint256 _amount,
        uint256 _tokenId
    ) internal {
        // Distribute funds: 10% royalty to creator(s), 5% to platform, 85% to seller
        uint256 royalty = (_amount * RESALE_ROYALTY) / 100;
        uint256 pFee = (_amount * FEE) / 100;
        uint256 sellerProceeds = _amount - (royalty + pFee);

        // Pay seller
        (bool successSeller, ) = seller.call{value: sellerProceeds}("");
        if (!successSeller) {
            revert ErrorsLibrary.NftMarketplace__PaymentFailed();
        }
        // Pay platform royalty
        (bool successPlatform, ) = address(rare24).call{value: pFee}("");
        if (!successPlatform) {
            revert ErrorsLibrary.NftMarketplace__PaymentFailed();
        }
        // Pay creator(s) royalty
        StructLibrary.Photo memory photo = rare24.getPhotoDetails(_tokenId);
        uint numberOfCreators = photo.creators.length;
        uint256 creatorRoyalty = royalty / numberOfCreators;
        for (uint256 j = 0; j < numberOfCreators; j++) {
            address creator = photo.creators[j];
            if (j == (numberOfCreators - 1) && numberOfCreators == 3) {
                creatorRoyalty += uint256(1);
            }
            // add to creator earnings
            rare24.addToCreatorEarnings(creator, creatorRoyalty);
            // transfer
            (bool successCreator, ) = creator.call{value: creatorRoyalty}("");
            if (!successCreator) {
                revert ErrorsLibrary.NftMarketplace__PaymentFailed();
            }
        }

        // Emit royalty payment event
        emit EventsLibrary.NftMarketplace__RoyaltyPaid(
            _tokenId,
            photo.creators,
            creatorRoyalty
        );
    }

    /*
     * GETTER FUNCTIONS
     */

    /**
     * @notice Returns the details of a specific buy offer.
     * @param _offerId The unique identifier of the buy offer
     * @return BuyOffer struct containing all offer details
     */
    function getBuyOffer(
        uint256 _offerId
    ) external view returns (StructLibrary.BuyOffer memory) {
        return s_buyOffers[_offerId];
    }

    /**
     * @notice Returns the details of a specific sale listing.
     * @param _listingId The unique identifier of the sale listing
     * @return SellListing struct containing all listing details
     */
    function getSaleListing(
        uint256 _listingId
    ) external view returns (StructLibrary.SellListing memory) {
        return s_sellListings[_listingId];
    }    

    /**
     * @notice Returns all buy offer IDs for a specific token.
     * @param _tokenId The unique identifier of the NFT token
     * @return Array of offer IDs associated with this token
     */
    function getTokenOffers(
        uint256 _tokenId
    ) external view returns (uint256[] memory) {
        return s_tokenOffers[_tokenId];
    }

    /**
     * @notice Returns all buy offer IDs made by a specific user.
     * @param _user The string identifier of the user (username)
     * @return Array of offer IDs created by this user
     */
    function getUserOffers(
        string memory _user
    ) external view returns (uint256[] memory) {
        return s_userOffers[_user];
    }

    /**
     * @notice Returns the last sale price for a token.
     * @param _tokenId The unique identifier of the token
     * @return The last sale price in Wei, or 0 if never sold
     */
    function getLastSale(uint256 _tokenId) external view returns(uint256) {
        return s_lastSale[_tokenId];
    }

    /**
     * @notice Returns all listing IDs for a specific token.
     * @param _tokenId The unique identifier of the token
     * @return Array of listing IDs associated with this token
     */
    function getTokenListings(
        uint256 _tokenId
    ) external view returns (uint256[] memory) {
        return s_tokenListings[_tokenId];
    }

    /**
     * @notice Returns all listing IDs for a specific user.
     * @param user The string identifier of the user (username)
     * @return Array of listing IDs created by this user
     */
    function getUsersListings(string memory user) external view returns (uint256[] memory) {
        return s_userListings[user];
    }

    /**
     * @notice Returns the current offer ID counter value.
     * @return The next offer ID that will be assigned to a new offer
     */
    function getOfferIdCounter() external view returns (uint256) {
        return s_offerIdCounter;
    }

    /**
     * @notice Returns the current listing ID counter value.
     * @return The next listing ID that will be assigned to a new listing
     */
    function getListingIdCounter() external view returns (uint256) {
        return s_listingIdCounter;
    }
}
