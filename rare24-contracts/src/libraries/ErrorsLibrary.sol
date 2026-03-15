// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library ErrorsLibrary {
    /**
     * @dev Error for when the calling contract is not authorized.
     */
    error Main__NotAuthorized();

    /**
     * @dev Error for when the cooldown period is still active.
     */
    error Main__CoolDownStillActive();

    /**
     * @dev Error for when a photo is inactive.
     */
    error Main__PhotoInactive();

    /**
     * @dev Error for when a photo mint duration has expired.
     */
    error Main__MintDurationExpired();

    /**
     * @dev Error for when the maximum supply for a photo has been reached.
     */
    error Main__MaxSupplyReached();

    /**
     * @dev Error for when a user has already minted a photo.
     */
    error Main__AlreadyMintedPhoto();

    /**
     * @dev Error for when insufficient funds are sent for minting.
     */
    error Main__InsufficientFunds();

    /**
     * @dev Error for when excess funds are sent for minting.
     */
    error Main__ExcessiveFunds();

    /**
     * @dev Error for when insufficient funds are sent for batch minting.
     */
    error Main__InsufficientFundsForBatchMint();

    /**
     * @dev Error for when excess funds are sent for batch minting.
     */
    error Main__ExcessFundsForBatchMint();

    /**
     * @dev Error for when the creator's payment transfer fails.
     */
    error Main__CreatorPaymentFailed();

    /**
     * @dev Error for when the revenue withdrawal fails.
     */
    error Main__RevenueWithdrawalFailed();

    /**
     * @dev Error for when the batch mint limit is exceeded.
     */
    error Main__BatchLimitExceeded();

    /**
     * @dev Error for when the platform fee is set too high (Above 50%).
     */
    error Main__FeeTooHigh();

    /**
     * @dev Error for when the platform fee is set too low (Below 10%).
     */
    error Main__FeeTooLow();

    /**
     * @dev Error for when zero funds are being withdrawn.
     */
    error Main__CannotWithdrawZeroFunds();

    /**
     * @dev Error for when an invalid platform wallet is set (zero address).
     */
    error Main__InvalidPlatformWallet();

    /**
     * @dev Error for when a non-creator attempts to deactivate a photo.
     */
    error Main__NotPhotoCreator();

    /**
     * @dev Error for when too many collaborators are added to a photo.
     */
    error Main__TooManyCollaborators();

    /**
     * @dev Error for when an invalid maximum supply is set (zero).
     */
    error Main__InvalidMaxSupply();

    /**
     * @dev Error for when an invalid photo price is set (zero).
     */
    error Main__InvalidPhotoPrice();

    /* RESELLNFT ERRORS */

    /**
     * @dev Error for when a user attempts to create a buy offer to themselves.
     */
    error NftMarketplace__CannotOfferToSelf();

    /**
     * @dev Error for when an invalid amount is specified in a buy offer.
     */
    error NftMarketplace__InvalidPrice();

    /**
     * @dev Error for when trying to accept an offer that has already been fulfilled.
     */
    error NftMarketplace__OfferedFullfiled();

    /**
     * @dev Error for when an invalid amount is specified in a buy offer.
     */
    error NftMarketplace__InvalidAmount();

    /**
     * @dev Error for when an invalid tokenId is parsed.
     */
    error NftMarketplace__InvalidTokenId();

    /**
     * @dev Error for when an invalid duration is parsed. (<7 days)
     */
    error NftMarketplace__InvalidTime();

    /**
     * @dev Error for when insufficient funds are sent for a buy offer.
     */
    error NftMarketplace__InsufficientFunds();

    /**
     * @dev Error for when excessive funds are sent for a buy offer.
     */
    error NftMarketplace__ExcessiveFunds();

    /**
     * @dev Error for when the specified seller does not own the token.
     */
    error NftMarketplace__SellerDoesNotOwnToken();

    /**
     * @dev Error for when the caller is not the seller of the token.
     */
    error NftMarketplace__NotTokenSeller();

    /**
     * @dev Error for when the caller is not the buyer of the token.
     */
    error NftMarketplace__NotTokenBuyer();

    /**
     * @dev Error for when a buy offer is not active.
     */
    error NftMarketplace__OfferNotActive();

    /**
     * @dev Error for when a buy offer has expired.
     */
    error NftMarketplace__OfferExpired();

    /**
     * @dev Error for when a buy offer is still active and cannot be refunded unless offer is cancelled.
     */
    error NftMarketplace__OfferStillActive();

    /**
     * @dev Error for when seller or creator payment transfer fails.
     */
    error NftMarketplace__PaymentFailed();

    /**
     * @dev Error for when no tokens are specified in the buy offer.
     */
    error NftMarketplace__NoTokensSpecified();

    /**
     * @dev Error for when the batch limit for creating buy offers is exceeded.
     */
    error NftMarketplace__BatchLimitExceeded();

    /**
     * @dev Error for when the lengths of tokenIds, amounts, and pricePerToken arrays do not match.
     */
    error NftMarketplace__ArrayLengthMismatch();

    /**
     * @dev Error for when a listing is not active.
     */
    error NftMarketplace__ListingNotActive();

    /**
     * @dev Error for when a listing has expired.
     */
    error NftMarketplace__ListingExpired();

    /**
     * @dev Error for when a listing has been sold completely.
     */
    error NftMarketplace__ListingFullfiled();
}
