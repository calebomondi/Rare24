# Rare24 - Decentralized NFT Platform

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black" alt="Next.js">
  <img src="https://img.shields.io/badge/Solidity-0.8.28-blue" alt="Solidity">
</p>

Rare24 is a decentralized NFT platform where creators drop one limited-edition photo NFT every 24 hours for fans to mint and collect. The platform enforces automatic royalties on every secondary sale, giving creators a forever source of income from their rarest moments.

## Project Structure

```
rare24/
├── rare24-fe/           # Frontend (Next.js + TypeScript)
│   └── README.md        # Detailed frontend documentation
└── rare24-contracts/    # Smart Contracts (Solidity + Foundry)
    └── README.md        # Detailed contracts documentation
```

| Directory | Description |
|-----------|-------------|
| [rare24-fe](./rare24-fe/) | Next.js 16 frontend application |
| [rare24-contracts](./rare24-contracts/) | Solidity smart contracts (Foundry) |

## Quick Start

### Prerequisites

- **Node.js**: v18+
- **Foundry**: Latest version
- **npm/yarn/pnpm/bun**: Latest version

### Frontend (rare24-fe)

```bash
cd rare24-fe
npm install
npm run dev
```

See [rare24-fe/README.md](./rare24-fe/README.md) for detailed documentation.

### Smart Contracts (rare24-contracts)

```bash
cd rare24-contracts
forge install
forge build
forge test
```

See [rare24-contracts/README.md](./rare24-contracts/README.md) for detailed documentation.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Rare24 Platform                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐      ┌─────────────────────────────┐   │
│  │    rare24-fe        │◄────►│    rare24-contracts         │   │
│  │  (Next.js Frontend) │      │  (Solidity Smart Contracts) │   │
│  │                     │      │                             │   │
│  │  • Next.js 16       │      │  • Rare24.sol (ERC-1155)    │   │
│  │  • TypeScript       │      │  • NftMarketplace.sol       │   │
│  │  • Wagmi/viem       │      │  • Base blockchain          │   │
│  │  • Tailwind CSS     │      │  • OpenZeppelin 5.x         │   │
│  └──────────┬──────────┘      └──────────────┬──────────────┘   │
│             │                                │                  │
│             │                                │                  │
│             ▼                                ▼                  │
│  ┌─────────────────────┐      ┌─────────────────────────────┐   │
│  │   External APIs     │      │       Blockchain            │   │
│  │                     │      │                             │   │
│  │  • Neynar (Auth)    │      │  • Base (L2)                │   │
│  │  • Alchemy (NFTs)   │      │  • ERC-1155 tokens          │   │
│  │  • Pinata (IPFS)    │      │  • Smart contracts          │   │
│  │  • Neon (Database)  │      │                             │   │
│  └─────────────────────┘      └─────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Core Features

| Feature | Description |
|---------|-------------|
| **Daily NFT Drops** | Creators mint exclusive photo NFTs once every 24 hours |
| **NFT Marketplace** | Buy, sell, and trade collected moments |
| **Farcaster Integration** | Built as a mini-app on the Warpcast/Farcaster platform |
| **User Profiles** | View creator profiles and their NFT collections |
| **Notifications** | Real-time alerts for purchases and sales |
| **Image Upload** | IPFS-based image storage via Pinata |

## Tech Stack

### Frontend (rare24-fe)

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Blockchain | Base (Ethereum L2) |
| Web3 Libraries | viem, wagmi |
| Database | Neon (serverless PostgreSQL) |
| Storage | Pinata (IPFS) |
| State Management | Zustand |
| Data Fetching | TanStack React Query |

### Smart Contracts (rare24-contracts)

| Component | Technology |
|-----------|------------|
| Smart Contracts | Solidity ^0.8.28 |
| Development Framework | Foundry (Forge) |
| Testing | Foundry + Forge Std |
| Libraries | OpenZeppelin Contracts 5.x |
| Contract Standards | ERC-1155, ERC-1155URIStorage |

## Deployed Contracts

| Network | Contract | Address |
|---------|----------|---------|
| Paseo | Rare24 | `0xE28d68A4AC00e3E3fe2C98C5c9B16A4b43c07D73` |
| Paseo | NftMarketplace | `0x8Bfe72c68E45D8eeeD2a4216474bE534951bf43b` |

## Documentation

- [Frontend Documentation](./rare24-fe/README.md)
- [Smart Contracts Documentation](./rare24-contracts/README.md)

## License

MIT License
