// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library StructLibrary {
    /**
    * @dev Struct to represent a Photo with its metadata.
    */
    struct Photo {
        uint256 tokenId;
        string creator;
        string pfpUrl;
        address[] creators;
        string metadataURI;
        uint256 price;
        uint256 createdAt;
        uint256 expiresAt;
        uint256 totalMinted;
        uint256 maxSupply; // total followers of the creator at the time of photo creation
        bool active;
    }

    /**
    * @dev Struct to represent a Buy Offer for NFTs.
    */
    struct BuyOffer {
        string buyerName;
        uint256 offerId;
        address buyerAddress;
        uint256 tokenId; // Which token IDs they want to buy
        uint256 amount; // How many editions they want
        uint256 received; // How many they have recieved
        uint256 offerPerToken; // Price in wei per token
        uint256 totalOffer; // total price for the entire offer
        uint256 createdAt;
        uint256 expiresAt;
        OfferStatus status;
        string message;
    }

    /**
    * @dev Enum to represent the status of a Buy Offer.
    */
    enum OfferStatus { Active, Accepted, Expired, Cancelled }

    /**
    * @dev Struct to represent a Token Listing.
    */
    struct SellListing {
        string sellerName;
        uint256 listingId;
        address sellerAddress;
        uint256 tokenId;
        uint256 amount;
        uint256 sold;
        uint256 pricePerToken;
        uint256 createdAt;
        uint256 expiresAt;
        ListingStatus status;
    }
    
    /**
    * @dev Enum to represent the status of a Listing.
    */
    enum ListingStatus { Active, Sold, Cancelled, Expired }

}