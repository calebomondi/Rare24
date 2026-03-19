# Rare24 MiniApp - Technical Documentation

## Project Overview

**Rare24** is a social app that allows users to collect and trade exclusive photo NFTs from their favorite creators. The platform operates on a "daily drop" model where only one moment (NFT) is released every 24 hours.

### Core Features
- **Daily NFT Drops**: Creators mint exclusive photo NFTs once every 24 hours
- **NFT Marketplace**: Buy, sell, and trade collected moments
- **Farcaster Integration**: Built as a mini-app on the Warpcast/Farcaster platform
- **User Profiles**: View creator profiles and their NFT collections
- **Notifications**: Real-time alerts for purchases and sales
- **Image Upload**: IPFS-based image storage via Pinata

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Blockchain**: Polkadot Hub Testnet
- **Web3 Libraries**: viem, wagmi
- **Authentication**: Neynar, Farcaster Quick Auth
- **Database**: Neon (serverless PostgreSQL)
- **Storage**: Pinata (IPFS)
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query

## Smart Contracts

### Rare24 Contract
**Address**: `0xE28d68A4AC00e3E3fe2C98C5c9B16A4b43c07D73`

An ERC-1155 contract for minting and managing creator moment NFTs.

**Key Functions**:
- `mint()` - Mint a new moment (once per 24 hours per creator)
- `mintBatch()` - Batch minting (with limits)
- `burn()` - Burn NFTs
- `setURI()` - Update metadata URI

### Marketplace Contract
**Address**: `0x8Bfe72c68E45D8eeeD2a4216474bE534951bf43b`

Handles secondary market trading of NFTs.

**Key Functions**:
- `listItem()` - List an NFT for sale
- `cancelListing()` - Remove a listing
- `buyItem()` - Purchase a listed item
- `makeOffer()` - Make an offer on an NFT
- `acceptOffer()` - Accept an incoming offer

---

## Type Definitions

### Core Types (`app/types/index.t.ts`)

```typescript
// User data from Farcaster
interface UserData {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  followerCount: number;
  followingCount: number;
  bio: string;
}

// NFT details
interface NFTDetails {
  tokenId: number;
  totalMint_balance: string;
  imageUrl: string;
}

// Creator's NFT collection
interface CreatorNftData {
  Nfts: NFTDetails[];
  mints: number;
  earning: string;
}

// Moment listing data
interface SharedMoments {
  tokenId: number;
  creator: string;
  creator_fid: number | null;
  pfpUrl: string;
  price: string;
  amount: string;
  sold: string;
  imageUrl: string;
  desc: string;
  expires: string;
}

// Marketplace data
interface MomentsSaleData {
  lastSale: string;
  collectionFloor: number;
  highestOffer: number;
  buyNow: OfferListing;
  orders: OfferListing[];
  listings: OfferListing[];
}

// Notifications
interface Notification {
  tokenId: number;
  buyer: string;
  imageUrl: string;
  price: string;
}
```

---

## State Management

### Zustand Stores (`app/store/useFarcasterStore.ts`)
```

**NotificationsStore** - Manages notification state
```typescript
interface NotificationsStore {
  notify: Notification[] | null;
  loading: boolean;
  setNotify: (notify: Notification[]) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}
```

---

## API Routes & Backend

### Alchemy (`app/backend/alchemy.ts`)
- Fetches user's NFT ownership data
- Retrieves NFT metadata

### Neon Database (`app/backend- Stores/neon.ts`)
 and retrieves user data
- Manages listing data
- Handles order/book data

### Upload (`app/backend/upload.ts`)
- Handles image uploads to IPFS via Pinata

### Price (`app/backend/price.ts`)
- Pricing utilities for the marketplace

---

## Key Components

### Providers (`app/providers/wagmiProvider.tsx`)
- Wraps the app with Wagmi (Web3) and React Query providers
- Initializes Farcaster SDK on client side

### Layout (`app/layout.tsx`)
- Root layout with:
  - Web3Provider (Wagmi + Query)
  - ThemeProvider (next-themes for dark mode)
  - TopBar component
  - BottomNavigation component
  - Manrope font

### Navigation
- **TopBar**: App logo, search, theme toggle
- **BottomNavigation**: Home, Marketplace, Upload, Notifications, Profile

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home page with latest shared moments |
| `/info` | About/info page |
| `/marketplace` | NFT marketplace with listings |
| `/marketplace/[token_id]/[address]` | NFT detail page |
| `/profile/[username]/[address]` | Creator profile page |
| `/search` | Search for creators/NFTs |
| `/notifications` | User notifications |
| `/uploadNft` | Upload and mint new NFT |
| `/user/[fid]/[username]` | User details page |

---

## Environment Variables

Required environment variables (see `.env.local`):

```env
# Database
DATABASE_URL=...

# Pinata (IPFS)
PINATA_JWT=...
NEXT_PUBLIC_GATEWAY_URL=...

# Blockchain
NEXT_PUBLIC_RPC_URL=...
NEXT_PUBLIC_CHAIN_ID=...

# Farcaster/Neynar
NEYNAR_API_KEY=...
NEXT_PUBLIC_FARCASTER_ID=...
NEXT_PUBLIC_FARCASTER_URL=...

# Alchemy
ALCHEMY_API_KEY=...

# Base
NEXT_PUBLIC_BASE_CONTRACT_ADDRESS=...
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS=...
```

---

## Development

### Running the Development Server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

### Start Production
```bash
npm start
```

---