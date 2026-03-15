// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/* OpenZeppelin Imports */
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/* Local imports */
import {StructLibrary} from "./libraries/StructLibrary.sol";
import {EventsLibrary} from "./libraries/EventsLibrary.sol";
import {ErrorsLibrary} from "./libraries/ErrorsLibrary.sol";

/**
 * @title Rare24 - Manages NFT metadata uploads, minting, and secondary market operations.
 * @dev This contract implements an ERC1155 multi-token standard with custom functionality for:
 *      - Creator photo uploads with metadata URIs
 *      - Limited edition minting with configurable supply
 *      - Automatic fund distribution between platform and creators
 *      - Collaborative creation with multiple creators per photo
 *      - Anti-spam cooldown mechanism for creators
 *      - Integration with NftMarketplace for secondary sales
 *
 * @notice This contract allows creators to upload photos (NFT metadata URI) of rare moments,
 *         set minting prices, and manage editions. Their followers can then mint limited editions
 *         of the NFTs, with funds distributed according to the platform fee structure.
 *
 * @dev Key architectural decisions:
 *      - Uses ERC1155 for efficient batch minting capabilities
 *      - Implements ReentrancyGuard for security against reentrancy attacks
 *      - Platform fee ranges from 10% to 50% (default 30%)
 *      - 24-hour cooldown between creator posts to prevent spam
 *      - Maximum 2 collaborators per photo (plus the uploader = 3 total)
 *      - Maximum batch mint of 3 photos per transaction
 *
 * @dev Integration note: The NftMarketplace contract is authorized to transfer tokens
 *      on behalf of users for secondary market transactions via authorizedSaleTransfer.
 */
contract Rare24 is ERC1155, Ownable, ReentrancyGuard {
    /*
     * STATE VARIABLES
     */
    uint private s_tokenIdCounter; // Counter for assigning unique token IDs
    uint8 private s_platformFee = 30; // 30% of mint fee
    uint256 private s_platformRevenue; // Accrued platform revenue
    uint256 private s_coolDownDuration = 24 hours; // 24 hours cooldown between posts
    address public treasury; // treasury wallet address

    uint8 public constant MAX_BATCH = 3; // Max photos allowed in a batch
    uint private constant MAX_COLLABORATORS = 2; // Max collaborators per photo (If you add sender total is 5)

    // tokenId => Photo details
    mapping(uint256 => StructLibrary.Photo) public s_tokenIdToPhotos;
    // Creator user => array of tokenIds created
    mapping(string => uint256[]) private s_creatorToTokenIds;
    // Creator creator => total mints
    mapping(string => uint256) private s_totalMints;
    // User user => array of tokenIds minted
    mapping(string => uint256[]) private s_userMintedTokenIds;
    // Track who minted what (tokenId => minter => hasMinted)
    mapping(uint256 => mapping(address => bool)) public s_hasMinted;
    // Track funds accrued for creators (creator => funds)
    mapping(address => uint256) private s_creatorToFunds;
    // Track creator posting duration to avoid spam (creator => lastPostTimestamp)
    mapping(string => uint256) private s_creatorNextPost;
    // Only authorized contracts to call key functionality (contract => isAuthorized)
    mapping(address => bool) public authorizedContracts;

    /*
     * CONSTRUCTOR
     */
    constructor(
        address _treasury,
        string memory uri_
    ) ERC1155(uri_) Ownable(msg.sender) {
        treasury = _treasury;
    }

    /*
     * MODIFIERS
     */
    
    modifier onlyAuthorized() {
        _onlyAuthorized();
        _;
    }


    /*
     * PUBLIC & EXTERNAL FUNCTIONS
     */

    /**
     * @notice Uploads a new photo NFT to the platform for follower minting.
     * @dev Creates a new photo entry with the provided metadata and minting parameters.
     *      Enforces a 24-hour cooldown between uploads per creator to prevent spam.
     *      Validates all input parameters and creates the photo with initial state.
     *
     * @param metadataURI The IPFS or HTTP URI pointing to the photo's JSON metadata
     * @param price The price in Wei required to mint one edition of this photo
     * @param maxSupply The maximum number of editions that can be minted (must be > 0)
     * @param creator The string identifier of the creator (username)
     * @param pfpUrl The URL to the creator's profile picture
     * @param creators Array of additional collaborator addresses (max 2)
     *
     * @return tokenId The unique identifier assigned to the newly created photo
     *
     * Reverts Main__CoolDownStillActive if creator has posted within last 24 hours
     * Reverts Main__TooManyCollaborators if more than 2 collaborators provided
     * Reverts Main__InvalidPhotoPrice if price is zero
     * Reverts Main__InvalidMaxSupply if maxSupply is zero
     *
     * Emits Main__PhotoCreated with tokenId, creators array, metadataURI, and expiration timestamp
     */
    function uploadNft(
        string calldata metadataURI,
        uint256 price,
        uint256 maxSupply,
        string memory creator,
        string memory pfpUrl,
        address[] memory creators
    ) external nonReentrant returns (uint256) {
        // Check that creator is not spamming posts (24 hours cooldown)
        if (block.timestamp < s_creatorNextPost[creator]) {
            revert ErrorsLibrary.Main__CoolDownStillActive();
        }
        // Validate max collaborators
        if (creators.length > MAX_COLLABORATORS) {
            revert ErrorsLibrary.Main__TooManyCollaborators();
        }
        // Validate price
        if (price == 0) {
            revert ErrorsLibrary.Main__InvalidPhotoPrice();
        }
        // Validate max supply
        if (maxSupply == 0) {
            revert ErrorsLibrary.Main__InvalidMaxSupply();
        }
        // Prepare list of all creators including msg.sender
        address[] memory allCreators = new address[](creators.length + 1);
        for (uint i = 0; i < creators.length; i++) {
            allCreators[i] = creators[i];
        }
        allCreators[creators.length] = msg.sender;

        // Increment tokenId
        s_tokenIdCounter++;
        // Associate tokenId with photo details
        s_tokenIdToPhotos[s_tokenIdCounter] = StructLibrary.Photo({
            tokenId: s_tokenIdCounter,
            creator: creator,
            pfpUrl: pfpUrl,
            creators: allCreators,
            metadataURI: metadataURI,
            price: price,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + s_coolDownDuration,
            totalMinted: 0,
            maxSupply: maxSupply,
            active: true
        });

        // Update creator's last post timestamp
        s_creatorNextPost[creator] = block.timestamp + s_coolDownDuration;
        // Add tokenId to creator's list
        s_creatorToTokenIds[creator].push(s_tokenIdCounter);

        // Emit event
        emit EventsLibrary.Main__PhotoCreated(
            s_tokenIdCounter,
            allCreators,
            metadataURI,
            block.timestamp + s_coolDownDuration
        );

        return s_tokenIdCounter;
    }

    /**
     * @notice Mints an edition of a photo NFT to the caller.
     * @dev Purchases and mints one edition of a photo for the sender.
     *      Validates that the photo is active, not expired, and the sender hasn't already minted.
     *      Requires exact ETH value matching the photo's price.
     *      Automatically distributes funds between platform and creators.
     *
     * @param tokenId The unique identifier of the photo to mint
     * @param minter The string identifier of the minter (username)
     *
     * Reverts Main__MaxSupplyReached if totalMinted equals maxSupply
     * Reverts Main__PhotoInactive if the photo has been deactivated
     * Reverts Main__MintDurationExpired if current time exceeds expiresAt (24h after creation)
     * Reverts Main__AlreadyMintedPhoto if sender has already minted this photo
     * Reverts Main__InsufficientFunds if msg.value is less than photo.price
     * Reverts Main__ExcessiveFunds if msg.value exceeds photo.price
     *
     * Emits Main__PhotoMinted with tokenId, minter address, creators array, and edition number
     */
    function mintPhoto(uint256 tokenId, string memory minter) public payable nonReentrant {
        // Fetch photo details
        StructLibrary.Photo storage photo = s_tokenIdToPhotos[tokenId];

        // check if max supply reached, is so make photo inactive
        if (photo.totalMinted == photo.maxSupply) {
            photo.active = false;
            revert ErrorsLibrary.Main__MaxSupplyReached();
        }
        // Check if photo is active
        if (!photo.active) {
            revert ErrorsLibrary.Main__PhotoInactive();
        }
        // Check if photo mint duration is still active
        if (block.timestamp > photo.expiresAt) {
            revert ErrorsLibrary.Main__MintDurationExpired();
        }
        // Check if sender has already minted this photo
        if (s_hasMinted[tokenId][msg.sender]) {
            revert ErrorsLibrary.Main__AlreadyMintedPhoto();
        }
        // Check if sufficient mint fee is sent
        if (msg.value < photo.price) {
            revert ErrorsLibrary.Main__InsufficientFunds();
        }
        // Check if sufficient mint fee is sent
        if (msg.value > photo.price) {
            revert ErrorsLibrary.Main__ExcessiveFunds();
        }

        // Mark as minted
        s_hasMinted[tokenId][msg.sender] = true;
        // Add tokenId to user's minted list
        s_userMintedTokenIds[minter].push(tokenId);
        // Increment creators mints
        s_totalMints[photo.creator] += 1;
        // Increment total minted count
        photo.totalMinted += 1;

        // Mint the photo edition to the minter
        _mint(msg.sender, tokenId, 1, "");

        // Distribute funds & update revenues
        _distributeFunds(photo);

        // Emit event
        emit EventsLibrary.Main__PhotoMinted(
            tokenId,
            msg.sender,
            photo.creators,
            photo.totalMinted
        );
    }

    /**
     * @notice Batch mints editions of multiple photos in a single transaction.
     * @dev Allows minting up to MAX_BATCH (3) photos at once for gas efficiency.
     *      Validates total price and ensures sufficient funds are provided.
     *      Requires exact total ETH value matching the sum of all photo prices.
     *
     * @param tokenIds Array of unique identifiers of the photos to mint
     * @param minter The string identifier of the minter (username)
     *
     * Reverts Main__BatchLimitExceeded if more than 3 token IDs provided
     * Reverts Main__InsufficientFundsForBatchMint if msg.value is less than total price
     * Reverts Main__ExcessFundsForBatchMint if msg.value exceeds total price
     * Reverts Main__MaxSupplyReached if any photo's max supply is reached
     * Reverts Main__PhotoInactive if any photo has been deactivated
     * Reverts Main__MintDurationExpired if any photo's mint duration has expired
     * Reverts Main__AlreadyMintedPhoto if sender has already minted any of the photos
     *
     * Emits Main__PhotoMintedBatch with array of tokenIds, minter address, and timestamp
     */
    function batchMintPhotos(
        uint256[] memory tokenIds,
        string memory minter
    ) external payable nonReentrant {
        // Check batch size limit
        if (tokenIds.length > MAX_BATCH) {
            revert ErrorsLibrary.Main__BatchLimitExceeded();
        }

        // Calculate total price for all photos
        uint256 totalPrice = 0;
        for (uint i = 0; i < tokenIds.length; i++) {
            StructLibrary.Photo storage photo = s_tokenIdToPhotos[tokenIds[i]];
            totalPrice += photo.price;
        }
        // Check if sufficient funds are sent
        if (msg.value < totalPrice) {
            revert ErrorsLibrary.Main__InsufficientFundsForBatchMint();
        }
        // Check if sufficient funds are sent
        if (msg.value > totalPrice) {
            revert ErrorsLibrary.Main__ExcessFundsForBatchMint();
        }

        // Prepare values array (1 edition each)
        uint256[] memory values = new uint256[](tokenIds.length);
        for (uint i = 0; i < tokenIds.length; i++) {
            values[i] = 1; // Each photo minted once
        }

        // batch mint
        _mintBatch(msg.sender, tokenIds, values, "");

        // Distribute funds for each photo
        for (uint i = 0; i < tokenIds.length; i++) {
            StructLibrary.Photo storage photo = s_tokenIdToPhotos[tokenIds[i]];
            // Mark as minted
            s_hasMinted[tokenIds[i]][msg.sender] = true;
            // Add tokenId to user's minted list
            s_userMintedTokenIds[minter].push(tokenIds[i]);
            // Increment creators mints
            s_totalMints[photo.creator] += 1;
            // Increment total minted count
            photo.totalMinted += 1;

            // Distribute funds & update revenues
            _distributeFunds(photo);
        }

        // Emit batch mint event
        emit EventsLibrary.Main__PhotoMintedBatch(
            tokenIds,
            msg.sender,
            uint32(block.timestamp)
        );
    }

    /**
     * @notice Returns the metadata URI for a specific token ID.
     * @dev Overrides the ERC1155 uri function to return per-token metadata.
     *      Each photo has its own metadataURI stored in the Photo struct.
     *
     * @param tokenId The unique identifier of the token
     * @return The metadata URI string for the specified token
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        return s_tokenIdToPhotos[tokenId].metadataURI;
    }

    /**
     * @notice Updates the platform fee percentage for future mint transactions.
     * @dev Only callable by the contract owner. Fee must be between 10% and 50%.
     *      Does not affect ongoing or past transactions, only new ones.
     *
     * @param newFee The new platform fee percentage (must be >= 10 and <= 50)
     *
     * Reverts Main__FeeTooLow if newFee is less than 10%
     * Reverts Main__FeeTooHigh if newFee exceeds 50%
     *
     * Emits Main__UpdatedPlatformFee with new fee and timestamp
     */
    function setPlatformFee(uint8 newFee) external onlyOwner {
        // Avoid Zero fee
        if (newFee < 10) {
            revert ErrorsLibrary.Main__FeeTooLow();
        }
        // Call early return if fee is unchanged
        if (newFee == s_platformFee) {
            return;
        }
        // Validate new fee (should not exceed 50%)
        if (newFee > 50) {
            revert ErrorsLibrary.Main__FeeTooHigh();
        }
        s_platformFee = newFee;

        // Emit event
        emit EventsLibrary.Main__UpdatedPlatformFee(
            newFee,
            uint32(block.timestamp)
        );
    }

    /**
     * @notice Updates the platform treasury wallet address for revenue collection.
     * @dev Only callable by the contract owner. Cannot set to zero address.
     *      This wallet receives platform fees from minting transactions.
     *
     * @param newWallet The new treasury wallet address (cannot be zero address)
     *
     * Reverts Main__InvalidPlatformWallet if newWallet is zero address
     *
     * Emits Main__UpdatedPlatformWallet with new wallet address and timestamp
     */
    function setTreasurytWallet(
        address newWallet
    ) external onlyOwner nonReentrant {
        // Validate new wallet address
        if (newWallet == address(0)) {
            revert ErrorsLibrary.Main__InvalidPlatformWallet();
        }
        treasury = newWallet;

        // Emit event
        emit EventsLibrary.Main__UpdatedPlatformWallet(
            newWallet,
            uint32(block.timestamp)
        );
    }

    /**
     * @notice Withdraws accrued platform revenue to the treasury wallet.
     * @dev Only callable by the contract owner. If amount exceeds balance, withdraws full balance.
     *      Provides protection against zero-value withdrawals.
     *
     * @param amount The amount of revenue to withdraw in Wei
     *
     * Reverts Main__CannotWithdrawZeroFunds if amount is zero and contract has no balance
     * Reverts Main__RevenueWithdrawalFailed if ETH transfer to treasury fails
     *
     * Emits Main__RevenueWithdrawn with amount and timestamp
     */
    function withdrawPlatformRevenue(
        uint amount
    ) external onlyOwner nonReentrant {
        // Check if amount or contract balance is zero
        if (amount == 0 || address(this).balance == 0) {
            revert ErrorsLibrary.Main__CannotWithdrawZeroFunds();
        }
        // Check if amount exceeds contract balance then adjust to max available
        if (amount > address(this).balance && address(this).balance > 0) {
            amount = address(this).balance;
        }
        // Transfer funds to platform wallet
        (bool success, ) = treasury.call{value: amount}("");
        if (!success) {
            revert ErrorsLibrary.Main__RevenueWithdrawalFailed();
        }

        // Emit event
        emit EventsLibrary.Main__RevenueWithdrawn(
            amount,
            uint32(block.timestamp)
        );
    }

    /**
     * @notice Deactivates a photo, preventing future mints.
     * @dev Only the original creator (last in the creators array) can deactivate their photo.
     *      Sets the photo's active flag to false, stopping new editions from being minted.
     *      Does not affect already minted editions.
     *
     * @param tokenId The unique identifier of the photo to deactivate
     *
     * Reverts Main__NotPhotoCreator if caller is not the original creator
     *
     * Emits Main__PhotoDeactivated with tokenId, creator address, and timestamp
     */
    function deactivatePhoto(uint256 tokenId) external {
        StructLibrary.Photo storage photo = s_tokenIdToPhotos[tokenId];
        // Only creator can deactivate their photo
        uint8 allCreatorsLength = uint8(photo.creators.length);
        if (photo.creators[allCreatorsLength - 1] != msg.sender) {
            revert ErrorsLibrary.Main__NotPhotoCreator();
        }
        photo.active = false;

        // Emit event
        emit EventsLibrary.Main__PhotoDeactivated(
            tokenId,
            msg.sender,
            uint32(block.timestamp)
        );
    }

    /**
     * @notice Transfers NFT ownership as part of a secondary market transaction.
     * @dev Only callable by authorized contracts (e.g., NftMarketplace).
     *      Used for fulfilling buy offers and listing purchases in the marketplace.
     *      Implements ERC1155's safeTransferFrom for secure transfer.
     *
     * @param from The address currently owning the NFT tokens
     * @param to The address receiving the NFT tokens
     * @param tokenId The unique identifier of the token to transfer
     * @param amount The quantity of tokens to transfer
     *
     * Reverts Main__NotAuthorized if caller is not in the authorizedContracts mapping
     */
    function authorizedSaleTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 amount
    ) external onlyAuthorized {
        _safeTransferFrom(from, to, tokenId, amount, "");
    }

    /**
     * @notice Authorizes or revokes a contract's access to restricted functions.
     * @dev Only callable by the contract owner. Authorized contracts can execute
     *      authorizedSaleTransfer and addToCreatorEarnings functions.
     *
     * @param _contract The address of the contract to authorize or revoke
     * @param _authorized Boolean flag: true to authorize, false to revoke
     */
    function setAuthorizedContract(
        address _contract, 
        bool _authorized
    ) external onlyOwner {
        authorizedContracts[_contract] = _authorized;
    }

    /**
     * @notice Adds royalty earnings to a creator's accrued funds.
     * @dev Only callable by authorized contracts (e.g., NftMarketplace).
     *      Called when secondary market sales occur to track creator royalties.
     *
     * @param creator The address of the creator to credit
     * @param amount The royalty amount to add in Wei
     *
     * Reverts Main__NotAuthorized if caller is not in the authorizedContracts mapping
     */
    function addToCreatorEarnings(address creator, uint256 amount) external onlyAuthorized {
        s_creatorToFunds[creator] += amount;
    }

    /**
     * @notice Receives plain ETH transfers.
     * @dev Fallback function to accept direct ETH transfers.
     *      Enables the contract to receive ETH from external sources including
     *      NftMarketplace for platform fees and creator royalty distributions.
     */
    receive() external payable {}

    /**
     * @notice Fallback function for receiving ETH with calldata.
     * @dev Receives ETH when .call() is used with data or when no matching function exists.
     *      Must be payable to support native ETH transfers in all scenarios.
     */
    fallback() external payable {}

    /*
     * INTERNAL & PRIVATE FUNCTIONS
     */

    /**
     * @dev Distributes minting funds between platform and creators.
     * @param photo The Photo struct containing creator information and price
     *
     * @dev Calculation: platformShare = price * platformFee / 100
     *                    creatorShare = price - platformShare
     *                    creatorShare is split equally among all creators
     *                    Rounding remainder goes to last creator if 3 creators
     *
     * Reverts Main__CreatorPaymentFailed if ETH transfer to any creator fails
     */
    function _distributeFunds(StructLibrary.Photo storage photo) internal {
        uint numberOfCreators = photo.creators.length;

        // Distribute funds & update revenues
        uint256 platformShare = (photo.price * s_platformFee) / 100;
        uint256 creatorShare = photo.price - platformShare;
        s_platformRevenue += platformShare;

        // Distribute creator share equally among all creators
        uint256 sharePerCreator = creatorShare / numberOfCreators;
        for (uint i = 0; i < numberOfCreators; i++) {
            if(i == (numberOfCreators - 1) && numberOfCreators == 3) {
                sharePerCreator += uint256(1);
            }
            // record
            s_creatorToFunds[photo.creators[i]] += sharePerCreator;
            // Pay each creator their share
            (bool success, ) = photo.creators[i].call{value: sharePerCreator}(
                ""
            );
            if (!success) {
                revert ErrorsLibrary.Main__CreatorPaymentFailed();
            }
        }
    }

    /**
     * @dev Modifier logic to verify caller is an authorized contract.
     * Reverts Main__NotAuthorized if msg.sender is not in authorizedContracts mapping
     */
    function _onlyAuthorized() internal view {
        if(!authorizedContracts[msg.sender]) {
            revert ErrorsLibrary.Main__NotAuthorized();
        }
    }

    /*
     * GETTER FUNCTIONS
     */

    /**
     * @notice Retrieves the complete details of a specific photo.
     * @param tokenId The unique identifier of the photo
     * @return Photo struct containing all photo metadata and state
     */
    function getPhotoDetails(
        uint256 tokenId
    ) external view returns (StructLibrary.Photo memory) {
        return s_tokenIdToPhotos[tokenId];
    }

    /**
     * @notice Returns all token IDs created by a specific creator.
     * @param creator The string identifier of the creator (username)
     * @return Array of token IDs created by this creator
     */
    function getCreatorTokenIds(
        string memory creator
    ) external view returns (uint256[] memory) {
        return s_creatorToTokenIds[creator];
    }

    /**
     * @notice Returns the total number of editions minted from a creator's photos.
     * @param creator The string identifier of the creator (username)
     * @return Total count of editions minted across all creator's photos
     */
    function getCreatorTotalMints(
        string memory creator
    ) external view returns (uint256) {
        return s_totalMints[creator];
    }

    /**
     * @notice Returns all token IDs minted by a specific user.
     * @param user The string identifier of the user (username)
     * @return Array of token IDs minted by this user
     */
    function getUserMintedTokenIds(
        string memory user
    ) external view returns (uint256[] memory) {
        return s_userMintedTokenIds[user];
    }

    /**
     * @notice Returns the current platform fee percentage.
     * @return The platform fee as a percentage (e.g., 30 = 30%)
     */
    function getPlatformFee() external view returns (uint8) {
        return s_platformFee;
    }

    /**
     * @notice Returns the current treasury wallet address.
     * @return The address receiving platform fees and revenue
     */
    function getTreasuryWallet() external view returns (address) {
        return treasury;
    }

    /**
     * @notice Returns the total accrued platform revenue from all minting transactions.
     * @return The total platform revenue in Wei
     */
    function getPlatformRevenue() external view returns (uint256) {
        return s_platformRevenue;
    }

    /**
     * @notice Returns the accrued funds for a specific creator from secondary sales.
     * @param creator The address of the creator
     * @return The total accrued royalty funds for this creator in Wei
     */
    function getCreatorAccruedFunds(
        address creator
    ) external view returns (uint256) {
        return s_creatorToFunds[creator];
    }

    /**
     * @notice Returns the timestamp when a creator can next post a photo.
     * @param creator The string identifier of the creator (username)
     * @return The Unix timestamp when the cooldown expires (0 if no recent post)
     */
    function getCreatorNextPost(
        string memory creator
    ) external view returns (uint256) {
        return s_creatorNextPost[creator];
    }

    /**
     * @notice Returns the current token ID counter value.
     * @return The next token ID that will be assigned to a new photo
     */
    function getTokenIdCounter() external view returns (uint256) {
        return s_tokenIdCounter;
    }

}
