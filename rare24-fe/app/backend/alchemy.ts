"use server"

import { RARE24_CONTRACT_ADDRESS } from "../blockchain/core";
import { NFTDetails, AlchemyNFTResponse } from "../types/index.t";
import { unstable_cache, revalidateTag } from "next/cache";

const network = 'base-mainnet';

export async function getUsersTokenIds(userAddress: `0x${string}`): Promise<NFTDetails[]> {
    return unstable_cache(
        async () => {
            // Return empty if no address
            if(!userAddress) return [];

            // API endpoint
            const url = `https://${network}.g.alchemy.com/nft/v3/${process.env.ALCHEMY_API_KEY}/getNFTsForOwner?owner=${userAddress}&contractAddresses[]=${RARE24_CONTRACT_ADDRESS}&withMetadata=true&pageSize=100`
            const options: RequestInit = { method: 'GET' }

            try {
                const response = await fetch(url, {
                    ...options,
                    next: { revalidate: 600 } // Cache for 10 min
                });
                const data: AlchemyNFTResponse = await response.json();

                if (!data) throw new Error("Failed To Fetch NFTs")

                const formattedData: NFTDetails[] = data.ownedNfts.map((nft) => ({
                    tokenId: Number(nft.tokenId),
                    totalMint_balance: nft.balance,
                    imageUrl: nft.image.originalUrl
                }))

                return formattedData.reverse()
            } catch (error) {
                console.error(error);
                return []
            }
        },
        [`user-nfts-${userAddress}`], // cache key
        {
            tags: [`user-nfts-${userAddress}`],
            revalidate: 60 // Revalidate every 5 minutes
        }
    )()
}

export async function revalidateUsersNfts(userAddress: `0x${string}`) {
    revalidateTag(`user-nfts-${userAddress}`, 'max')
}