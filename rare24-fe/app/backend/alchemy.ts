"use server"

import { RARE24_CONTRACT_ADDRESS, RARE24_CONTRACT_ABI } from "../blockchain/core";
import { NFTDetails } from "../types/index.t";
import { unstable_cache, revalidateTag } from "next/cache";
import { readContract } from "@wagmi/core";
import { config } from "@/utils/wagmi";
import { polkadotHubTestnet } from "@/utils/chains";
import { Config } from "wagmi";
import { fetchImageFromMetadata } from "../blockchain/getterHooks";

async function getTokenIds(): Promise<number[]> {
    const tokenIdCounter = await readContract(config as Config, {
        chainId: polkadotHubTestnet.id,
        abi: RARE24_CONTRACT_ABI,
        address: RARE24_CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'getTokenIdCounter',
    }) as bigint;
    
    return Array.from({ length: Number(tokenIdCounter) }, (_, i) => i + 1);
}

export async function getUsersTokenIds(userAddress: `0x${string}`): Promise<NFTDetails[]> {
    return unstable_cache(
        async () => {
            if (!userAddress) return [];

            try {
                const tokenIds = await getTokenIds();
                
                const nftPromises = tokenIds.map(async (tokenId) => {
                    const balance = await readContract(config as Config, {
                        chainId: polkadotHubTestnet.id,
                        abi: RARE24_CONTRACT_ABI,
                        address: RARE24_CONTRACT_ADDRESS as `0x${string}`,
                        functionName: 'balanceOf',
                        args: [userAddress, BigInt(tokenId)]
                    }) as bigint;

                    if (balance > BigInt(0)) {
                        const details = await readContract(config as Config, {
                            chainId: polkadotHubTestnet.id,
                            abi: RARE24_CONTRACT_ABI,
                            address: RARE24_CONTRACT_ADDRESS as `0x${string}`,
                            functionName: 'getPhotoDetails',
                            args: [BigInt(tokenId)]
                        });
                        
                        return {
                            tokenId,
                            totalMint_balance: String(balance),
                            imageUrl: await fetchImageFromMetadata((details as any).metadataURI)
                        };
                    }
                });

                const results = await Promise.all(nftPromises);
                const filtered = results.filter((nft): nft is NFTDetails => nft !== undefined && nft !== null && nft.imageUrl !== '');
                return filtered.reverse();
            } catch (error) {
                console.error("Error fetching user NFTs:", error);
                return [];
            }
        },
        [`user-nfts-${userAddress}`],
        {
            tags: [`user-nfts-${userAddress}`],
            revalidate: 60
        }
    )()
}

export async function revalidateUsersNfts(userAddress: `0x${string}`) {
    revalidateTag(`user-nfts-${userAddress}`, 'max')
}