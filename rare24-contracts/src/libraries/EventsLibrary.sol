// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library EventsLibrary {
    /* MAIN EVENTS */

    /**
     * @dev Emitted when a new photo is created.
     */
    event Main__PhotoCreated(
        uint256 indexed tokenId,
        address[] indexed creators,
        string metadataURI,
        uint256 expiresAt
    );

    /**
     * @dev Emitted when a photo is minted.
     */
    event Main__PhotoMinted(
        uint256 indexed tokenId,
        address indexed minter,
        address[] indexed creators,
        uint256 editionNumber
    );

    /**
     * @dev Emitted when a batch of photos is minted.
     */
    event Main__PhotoMintedBatch(
        uint256[] indexed tokenIds,
        address indexed minter,
        uint32 timestamp
    );

    /**
     * @dev Emitted when a photo is deactivated.
     */
    event Main__PhotoDeactivated(
        uint256 indexed tokenId,
        address indexed creator,
        uint32 timestamp
    );

    /**
     * @dev Emitted when revenue is withdrawn.
     */
    event Main__RevenueWithdrawn(uint256 amount, uint32 timestamp);

    /**
     * @dev Emitted when the platform fee is updated.
     */
    event Main__UpdatedPlatformFee(uint256 newPlatformFee, uint32 timestamp);

    /**
     * @dev Emitted when the platform wallet is updated.
     */
    event Main__UpdatedPlatformWallet(
        address newPlatformWallet,
        uint32 timestamp
    );

    /* RESALE NFTs EVENTS */

    /**
     * @dev Emitted when a buy offer is created.
     */
    event NftMarketplace__BuyOfferCreated(
        uint256 indexed offerId,
        address indexed buyer,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 pricePerToken
    );

    /**
     * @dev Emitted when a buy offer is accepted.
     */
    event NftMarketplace__BuyOfferAccepted(
        uint256 indexed tokenId,
        string seller,
        string buyer,
        uint256 price,
        uint32 timeStamp
    );

    /**
     * @dev Emitted when a buy offer is cancelled.
     */
    event NftMarketplace__BuyOfferCancelled(uint256 indexed offerId);

    /**
     * @dev Emitted when a buy offer expires.
     */
    event NftMarketplace__BuyOfferExpired(uint256 indexed offerId);

    /**
     * @dev Emitted when a royalty is paid to a creator.
     */
    event NftMarketplace__RoyaltyPaid(
        uint256 indexed tokenId,
        address[] indexed creators,
        uint256 amount
    );

    /**
     * @dev Emitted when a listing is created.
     */
    event NftMarketplace__ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        uint256 tokenId,
        uint256 pricePerToken
    );

    /**
     * @dev Emitted when a token listed is purchased.
     */
    event NftMarketplace__ListingPurchased(
        uint256 indexed tokenId,
        string seller,
        string buyer,
        uint256 price,
        uint32 timeStamp
    );

    /**
     * @dev Emitted when a listing is cancelled.
     */
    event NftMarketplace__ListingCancelled(uint256 indexed listingId);

    /**
     * @dev Emitted when a listing price is updated.
     */
    event NftMarketplace__ListingPriceUpdate(
        address indexed user,
        uint256 indexed listingId,
        uint256 newPrice
    );
}
