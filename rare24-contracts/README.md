# Rare24 - Decentralized NFT Platform

<p align="center">
  <img src="https://img.shields.io/badge/Solidity-0.8.28-blue" alt="Solidity Version">
  <img src="https://img.shields.io/badge/Foundry-Forge-blue" alt="Foundry">
  <img src="https://img.shields.io/badge/OpenZeppelin-5.0.0-green" alt="OpenZeppelin">
</p>

A decentralized NFT platform where creators drop one limited-edition photo NFT every 24 hours for fans to mint and collect. Rare24 enforces automatic royalties on every secondary sale, giving creators a forever source of income from their rarest moments.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [OpenZeppelin Libraries](#openzeppelin-libraries)
  - [ERC1155 Multi-Token Standard](#erc1155-multi-token-standard)
  - [Other OpenZeppelin Components](#other-openzeppelin-components)
- [Contract Overview](#contract-overview)
  - [Rare24 Contract](#rare24-contract)
  - [NftMarketplace Contract](#nftmarketplace-contract)
- [System Architecture Diagram](#system-architecture-diagram)
- [Data Flow](#data-flow)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Fee Structure](#fee-structure)
- [Security Considerations](#security-considerations)

---

## Architecture Overview

Rare24 is built on the **ERC-1155 Multi-Token Standard**, which allows for efficient management of multiple token types within a single smart contract. This architecture supports:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Rare24 Platform                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐      ┌─────────────────────────────┐   │
│  │    Rare24.sol       │◄────►│    NftMarketplace.sol       │   │
│  │  (ERC1155, Ownable) │      │    (Secondary Market)       │   │
│  └──────────┬──────────┘      └──────────────┬──────────────┘   │
│             │                                │                  │
│             ▼                                ▼                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     Users / Creators                     │   │
│  │  • Upload Photos    • Mint NFTs    • Buy/Sell Listings   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Core Features

| Feature | Description |
|---------|-------------|
| **Creator NFT Minting** | Creators upload photos with metadata, set prices, define max supply |
| **Multi-Creator Support** | Up to 3 collaborators per NFT (1 sender + 2 additional) |
| **Batch Minting** | Users can mint up to 3 different NFTs in a single transaction |
| **Secondary Marketplace** | Integrated marketplace for listings and purchases |
| **Automated Royalties** | 10% royalty to creators on secondary sales |
| **Platform Fees** | 30% on primary minting, 5% on secondary sales |

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| **Smart Contracts** | Solidity ^0.8.28 |
| **Development Framework** | Foundry (Forge) |
| **Testing** | Foundry + Forge Std |
| **Libraries** | OpenZeppelin Contracts 5.x |
| **Contract Standards** | ERC-1155, ERC-1155URIStorage |

---

## OpenZeppelin Libraries

### ERC1155 Multi-Token Standard

The **ERC-1155** standard is the foundation of the Rare24 platform. This standard allows a single contract to manage multiple token types (fungible, semi-fungible, and non-fungible).

```
┌──────────────────────────────────────────────────────────────────┐
│                     ERC1155 Token Architecture                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    ERC1155 Contract                         │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │                                                             │ │
│  │  ┌─────────────────────────────────────────────────────┐    │ │
│  │  │  Token ID 1 (Photo NFT - Edition 1)                 │    │ │
│  │  │  • Total Supply: 100                                │    │ │
│  │  │  • Holders: Alice, Bob, Charlie                     │    │ │
│  │  └─────────────────────────────────────────────────────┘    │ │
│  │                                                             │ │
│  │  ┌─────────────────────────────────────────────────────┐    │ │
│  │  │  Token ID 2 (Photo NFT - Edition 2)                 │    │ │
│  │  │  • Total Supply: 50                                 │    │ │
│  │  │  • Holders: Alice, Dave                             │    │ │
│  │  └─────────────────────────────────────────────────────┘    │ │
│  │                                                             │ │
│  │  ┌─────────────────────────────────────────────────────┐    │ │
│  │  │  Token ID 3 (Photo NFT - Edition 3)                 │    │ │
│  │  │  • Total Supply: 200                                │    │ │
│  │  │  • Holders: Alice, Bob, Eve, Frank                  │    │ │
│  │  └─────────────────────────────────────────────────────┘    │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Key Benefits:                                                   │
│  • Single contract manages multiple token types                  │
│  • Gas-efficient batch transfers                                 │
│  • Supports fungible & non-fungible tokens                       │
│  • URI-based metadata storage                                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### Why ERC-1155?

| Feature | ERC-721 | ERC-1155 | Benefit for Rare24 |
|---------|---------|----------|---------------------|
| Multiple token types | Multiple contracts | Single contract | ✓ Efficient management |
| Batch transfers | Individual calls | Native support | ✓ Gas savings |
| Metadata | Single URI | Per-token URI | ✓ Unique metadata per edition |
| Gas efficiency | High for multi-token | Optimized | ✓ Lower costs |

#### Key ERC-1155 Functions Used

```solidity
// Minting a single edition
function _mint(address to, uint256 id, uint256 amount, bytes memory data)

// Batch minting multiple editions
function _mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)

// Safe transfer (required for NFT safety)
function _safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data)

// URI retrieval for metadata
function uri(uint256 tokenId) returns (string memory)
```

### Other OpenZeppelin Components

```
┌─────────────────────────────────────────────────────────────────┐
│                  OpenZeppelin Component Usage                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Rare24.sol                                                     │
│  ├── ERC1155 (Token Standard)                                   │
│  │      └── Provides: _mint, _mintBatch, _safeTransferFrom,     │
│  │                   balanceOf, safeTransferFrom                │
│  ├── Ownable (Access Control)                                   │
│  │      └── Provides: owner, onlyOwner, transferOwnership       │
│  └── ReentrancyGuard (Security)                                 │
│          └── Provides: nonReentrant modifier                    │
│                                                                 │
│  NftMarketplace.sol                                             │
│  └── ReentrancyGuard (Security)                                 │
│          └── Provides: nonReentrant modifier                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Component Details

| Library | Purpose | Key Features |
|---------|---------|--------------|
| **ERC1155** | Multi-token standard | Batch minting, safe transfers, per-token URI |
| **Ownable** | Access control | Single owner, ownership transfer |
| **ReentrancyGuard** | Reentrancy protection | Prevents reentrancy attacks via `nonReentrant` |

---

## Contract Overview

### Rare24 Contract

The main contract handling NFT creation, minting, and primary sales.

```solidity
contract Rare24 is ERC1155, Ownable, ReentrancyGuard
```

#### Key Functions

| Function | Description |
|----------|-------------|
| `uploadNft()` | Create a new photo NFT with metadata, price, and max supply |
| `mintPhoto()` | Mint a single edition of a photo NFT |
| `batchMintPhotos()` | Mint up to 3 different photo NFTs in one transaction |
| `deactivatePhoto()` | Creator can deactivate their photo (stop further mints) |
| `setPlatformFee()` | Owner updates platform fee (10-50%) |
| `withdrawPlatformRevenue()` | Owner withdraws accrued platform fees |


### NftMarketplace Contract

Handles secondary market operations (listings, offers, purchases).

```solidity
contract NftMarketplace is ReentrancyGuard
```

#### Key Functions

| Function | Description |
|----------|-------------|
| `makeBuyOffer()` | Create a buy offer for an NFT |
| `acceptBuyOffer()` | Seller accepts an offer and transfers NFT |
| `cancelBuyOffer()` | Buyer cancels their active offer |
| `createListing()` | List an NFT for fixed-price sale |
| `buyListing()` | Purchase a listed NFT instantly |

#### Fee Structure (Secondary Market)

```
┌─────────────────────────────────────────────────────────────────┐
│              Secondary Market Fee Distribution                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Sale Price: 100 ETH                                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │   Creator Royalty (10%)      → 10 ETH                   │    │
│  │   Platform Fee (5%)          → 5 ETH                    │    │
│  │   Seller Proceeds (85%)      → 85 ETH                   │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SYSTEM ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         EXTERNAL ACTORS                              │   │
│  │                                                                      │   │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐      │   │
│  │   │  Creators   │    │   Minters   │    │    Collectors       │      │   │
│  │   │             │    │             │    │   (Buy/Sell NFTs)   │      │   │
│  │   │ • Upload    │    │ • Mint      │    │                     │      │   │
│  │   │ • Collaborate│   │ • Batch mint│    │  • Make Offers      │      │   │
│  │   │ • Withdraw  │    │             │    │  • List for Sale    │      │   │
│  │   │   royalties │    │             │    │  • Buy Listings     │      │   │
│  │   └──────┬──────┘    └──────┬──────┘    └──────────┬──────────┘      │   │
│  │          │                  │                      │                 │   │
│  └──────────┼──────────────────┼──────────────────────┼─────────────────┘   │
│             │                  │                      │                     │
│             ▼                  ▼                      ▼                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      SMART CONTRACTS                                  │  │
│  │                                                                       │  │
│  │  ┌────────────────────────────────┐  ┌────────────────────────────┐   │  │
│  │  │         Rare24.sol             │  │    NftMarketplace.sol      │   │  │
│  │  │                                │  │                            │   │  │
│  │  │  ┌──────────┐  ┌───────────┐   │  │  ┌──────────┐  ┌────────┐  │   │  │
│  │  │  │ ERC1155  │  │  Ownable  │   │  │  │ Offers   │  │Listings│  │   │  │
│  │  │  └──────────┘  └───────────┘   │  │  └──────────┘  └────────┘  │   │  │
│  │  │  ┌──────────┐  ┌───────────┐   │  │  ┌──────────┐  ┌────────┐  │   │  │
│  │  │  │Reentrancy│  │  Photos   │   │  │  │Reentrancy│  │ Royalty│  │   │  │
│  │  │  │  Guard   │  │  Storage  │   │  │  │  Guard   │  │  Dist. │  │   │  │
│  │  │  └──────────┘  └───────────┘   │  │  └──────────┘  └────────┘  │   │  │
│  │  └────────────────────────────────┘  └────────────────────────────┘   │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│             │                  │                     │                      │
│             ▼                  ▼                     ▼                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         STORAGE LAYER                                │   │
│  │                                                                      │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐      │   │
│  │  │   Token Data   │  │   User Data    │  │   Market Data      │      │   │
│  │  │                │  │                │  │                    │      │   │
│  │  │ • Metadata URI │  │ • Creator →    │  │ • Offers → IDs     │      │   │
│  │  │ • Price        │  │   TokenIDs     │  │ • Listings → IDs   │      │   │
│  │  │ • Max Supply   │  │ • Minter →     │  │ • Highest Offers   │      │   │
│  │  │ • Total Minted │  │   TokenIDs     │  │ • Last Sale Price  │      │   │
│  │  │ • Active State │  │ • Creator      │  │                    │      │   │
│  │  │                │  │   Funds        │  │                    │      │   │
│  │  └────────────────┘  └────────────────┘  └────────────────────┘      │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Primary Market Flow (Minting)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Primary Market: Minting Flow                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Creator                                                                │
│    │                                                                    │
│    │ 1. uploadNft(metadataURI, price, maxSupply)                        │
│    ▼                                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Rare24 Contract                              │   │
│  │                                                                  │   │
│  │  1a. Validate inputs (price > 0, supply > 0)                     │   │
│  │  1b. Check cooldown (24h since last post)                        │   │
│  │  1c. Create Photo struct with metadata                           │   │
│  │  1d. Store tokenId → Photo mapping                               │   │
│  │  1e. Update creator's next post timestamp                        │   │
│  │                                                                  │   │
│  │  Emits: PhotoCreated(tokenId, creators, metadataURI, expiresAt)  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│    │                                                                    │
│    ▼                                                                    │
│  Follower / Minter                                                      │
│    │                                                                    │
│    │ 2. mintPhoto(tokenId) {value: price}                               │
│    ▼                                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Rare24 Contract                              │   │
│  │                                                                  │   │
│  │  2a. Validate: active, not expired, not maxed, not already minted│   │
│  │  2b. Validate: msg.value == photo.price (exact match)            │   │
│  │  2c. Mark as minted (s_hasMinted[tokenId][minter] = true)        │   │
│  │  2d. _mint(minter, tokenId, 1, "")                               │   │
│  │  2e. _distributeFunds(photo)                                     │   │
│  │       • platformFee = price * 30%                                │   │
│  │       • creatorShare = price - platformFee                       │   │
│  │       • Distribute creatorShare equally                          │   │
│  │  2f. Increment totalMinted                                       │   │
│  │                                                                  │   │
│  │  Emits: PhotoMinted(tokenId, minter, creators, editionNumber)    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Secondary Market Flow (Listing Purchase)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  Secondary Market: Listing Purchase Flow                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Seller                                                                 │
│    │                                                                    │
│    │ 1. createListing(tokenId, amount, pricePerToken, duration)         │
│    ▼                                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                  NftMarketplace Contract                         │   │
│  │                                                                  │   │
│  │  1a. Validate: owns tokens, valid inputs, duration > 6 days      │   │
│  │  1b. Create SellListing struct                                   │   │
│  │  1c. Store listing                                               │   │
│  │                                                                  │   │
│  │  Emits: ListingCreated(listingId, seller, tokenId, price)        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│    │                                                                    │
│    ▼                                                                    │
│  Buyer                                                                  │
│    │                                                                    │
│    │ 2. buyListing(listingId) {value: price}                            │
│    ▼                                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                  NftMarketplace Contract                         │   │
│  │                                                                  │   │
│  │  2a. Validate: listing active, not expired, not self-purchase    │   │
│  │  2b. Validate: msg.value == price (exact match)                  │   │
│  │  2c. Verify seller still owns tokens                             │   │
│  │  2d. Update listing status (sold++)                              │   │
│  │  2e. Update lastSale[tokenId] = price                            │   │
│  │                                                                  │   │
│  │  2f. Transfer NFT: rare24.authorizedSaleTransfer(...)            │   │
│  │                                                                  │   │
│  │  2g. _distributeResellFunds(seller, price, tokenId)              │   │
│  │       • royalty = price * 10%  → creators                        │   │
│  │       • pFee = price * 5%    → Rare24 contract                   │   │
│  │       • sellerProceeds = price - royalty - pFee                  │   │
│  │                                                                  │   │
│  │  Emits: ListingPurchased, RoyaltyPaid                            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- **Solidity**: ^0.8.28
- **Foundry**: Latest version
- **Node**: v18+ (for Foundry tools)

### Installation

```bash
# Install Foundry dependencies
forge install

# Build contracts
forge build
```

### Running Tests

```bash
# Run all tests
forge test

# Run with coverage
forge coverage

# Run specific test file
forge test --match-path test/unit/Rare24Test.t.sol

# Run with verbosity
forge test -vvv
```

### Deployment

```bash
# Deploy to local Anvil
forge script script/DeployMarketplace.s.sol --fork-url http://localhost:8545

# Deploy to testnet (configure .env first)
forge script script/DeployRare24.s.sol --rpc-url $PASEO_RPC_URL --private-key $PRIVATE_KEY --broadcast
```

---

## Testing

The project includes comprehensive tests:

```
test/
├── unit/
│   ├── Rare24Test.t.sol      # Core NFT functionality tests
│   └── NftMarketplaceTest.t.sol  # Marketplace tests
└── fuzz/
    ├── Handlers.t.sol        # Fuzz testing handlers
    └── Invariants.t.sol     # Invariant tests
```

### Test Coverage

| Contract | Functions Tested |
|----------|-----------------|
| **Rare24** | uploadNft, mintPhoto, batchMintPhotos, deactivatePhoto, setPlatformFee, withdrawPlatformRevenue |
| **NftMarketplace** | makeBuyOffer, acceptBuyOffer, cancelBuyOffer, createListing, buyListing |

---

## Fee Structure

### Primary Market (Minting)

| Component | Percentage | Recipient |
|-----------|------------|-----------|
| Platform Fee | 30% | Treasury |
| Creator Share | 70% | Split among collaborators |

### Secondary Market (Resale)

| Component | Percentage | Recipient |
|-----------|------------|-----------|
| Creator Royalty | 10% | Original creators |
| Platform Fee | 5% | Rare24 contract |
| Seller Proceeds | 85% | Seller |

---

## Security Considerations

### Implemented Protections

1. **Reentrancy Guard**: All state-changing functions use `nonReentrant` modifier
2. **Access Control**: Only owner can call administrative functions
3. **Input Validation**: All user inputs validated before processing
4. **Exact Value Matching**: ETH transfers require exact amounts (no overpayment)

### Known Limitations

| Limitation | Description |
|------------|-------------|
| **Cooldown Period** | 24 hours between creator posts |
| **Batch Limit** | Maximum 3 NFTs per batch mint |
| **Collaborator Limit** | Maximum 2 additional collaborators |
| **Listing Duration** | Minimum 7 days for listings |

---

## Contract Addresses

| Network | Contract | Address |
|---------|----------|---------|
| Paseo | Rare24 | `0xE28d68A4AC00e3E3fe2C98C5c9B16A4b43c07D73` [(deployed & verified)](https://blockscout-testnet.polkadot.io/address/0xE28d68A4AC00e3E3fe2C98C5c9B16A4b43c07D73) |
| Paseo | NftMarketplace | `0x8Bfe72c68E45D8eeeD2a4216474bE534951bf43b` [(deployed & verified)](https://blockscout-testnet.polkadot.io/address/0x8Bfe72c68E45D8eeeD2a4216474bE534951bf43b) |

---

## License

MIT License - See [LICENSE](./LICENSE) file for details.

---

## Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) - Smart contract libraries
- [Foundry](https://foundry.paradigm.xyz/) - Development framework
- [Solidity](https://soliditylang.org/) - Smart contract language