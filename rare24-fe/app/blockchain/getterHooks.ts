"use server"

import { RARE24_CONTRACT_ADDRESS, RARE24_CONTRACT_ABI, MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_ABI } from "./core";
import { readContract } from "@wagmi/core";
import { config } from "@/utils/wagmi";
import { Config } from "wagmi";
import { formatEther } from "viem";
// import { getAllFollowings } from "../backend/farcasterUser";
import { getUsersTokenIds } from "../backend/alchemy";
import { NFTDetails } from "../types/index.t";
import { getUserByUsername } from "../backend/neon";
import { unstable_cache, revalidateTag } from "next/cache";

/* RARE24 CONTRACT */

export async function getCreatorMomentsCount(creator_username: string) {
    // get creator's tokenId array
    const tokenIdArray = await readContract(config as Config, {
        abi: RARE24_CONTRACT_ABI,
        address: RARE24_CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'getCreatorTokenIds',
        args: [creator_username]
    }) as bigint[];

    // return number of moments shared
    return tokenIdArray.length
}

export async function checkIfCanPost(creator_username: string) {
    // get creator's last post timestamp
    const nextPost = await readContract(config as Config, {
        abi: RARE24_CONTRACT_ABI,
        address: RARE24_CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'getCreatorNextPost',
        args: [creator_username]
    }) as bigint;

    // compare to current timestamp
    const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const diff = nextPost - currentTimestamp;
    let toNext = ''
    if(diff > 0) {
        toNext = formatDuration(Number(diff))
    }
    const canPost = currentTimestamp > nextPost;

    return {canPost, toNext};
}

// Timestamp to "10 min or 8hr 23min"
function formatDuration(seconds: number) {
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} min`
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours} hr ${minutes} min`
}

export async function getCreatorMoments(creator_username: string, creator_address: `0x${string}`) {
    return unstable_cache(
        async () => {
        if(!creator_address || !creator_username) {
            return {
                Nfts: [],
                mints: 0,
                earning: '0'
            }
        }
        // Fetch earnings and token IDs in parallel
        const [accumEarnings, tokenIdArray] = await Promise.all([
            readContract(config as Config, {
                abi: RARE24_CONTRACT_ABI,
                address: RARE24_CONTRACT_ADDRESS as `0x${string}`,
                functionName: 'getCreatorAccruedFunds',
                args: [creator_address]
            }) as Promise<bigint>,
            readContract(config as Config, {
                abi: RARE24_CONTRACT_ABI,
                address: RARE24_CONTRACT_ADDRESS as `0x${string}`,
                functionName: 'getCreatorTokenIds',
                args: [creator_username]
            }) as Promise<bigint[]>
        ]);

        const earning = formatEther(accumEarnings);

        // Early return if no tokens
        if (tokenIdArray.length === 0) {
            return {
                Nfts: [],
                mints: 0,
                earning: earning
            };
        }

        // Fetch all NFT details in parallel
        const nftPromises = tokenIdArray.map(tokenId =>
            readContract(config as Config, {
                abi: RARE24_CONTRACT_ABI,
                address: RARE24_CONTRACT_ADDRESS as `0x${string}`,
                functionName: 'getPhotoDetails',
                args: [BigInt(tokenId)]
            }).then((nft: any) => ({
                tokenId: Number(tokenId),
                metadataURI: nft.metadataURI as string,
                price: formatEther(nft.price),
                createdAt: formatDate(Number(nft.createdAt)),
                totalMinted: String(nft.totalMinted),
                maxSupply: String(nft.maxSupply),
            }))
        );

        const nftDetails = await Promise.all(nftPromises);

        // Calculate total mints
        const totalMints = nftDetails.reduce((sum, nft) => sum + Number(nft.totalMinted), 0);

        // Fetch all images in parallel
        const formattedPhotos = await Promise.all(
            nftDetails.map(async (nft) => ({
                tokenId: nft.tokenId,
                totalMint_balance: nft.totalMinted,
                imageUrl: await fetchImageFromMetadata(nft.metadataURI)
            }))
        );

        return {
            Nfts: formattedPhotos.reverse(),
            mints: totalMints,
            earning: earning
        };
        },
        [`creator-moments-${creator_address}`], // cache key
        {
            tags: [`creator-moments-${creator_address}`],
            revalidate: 60 // Revalidate every 1 minute
        }
    )()
}

export async function revalidateCreatorMoments(creator_address: `0x${string}`) {
  revalidateTag(`creator-moments-${creator_address}`, 'max')
}

// Timestamp to "10 June, 2023"
function formatDate(timestamp: number) {
  const date = new Date(timestamp * 1000); // multiply by 1000 if timestamp is in seconds
  
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' }).slice(0,3);
  const year = date.getFullYear();
  
  return `${day} ${month}, ${year}`;
}

// Function to fetch image URL from metadata URI
export async function fetchImageFromMetadata(metadataURI: string): Promise<string> {
  try {
    const response = await fetch(metadataURI, {
        next: { revalidate: 600 } // Cache for 10 min
    });
    const metadata = await response.json();
    return metadata.image || '';
  } catch (error: any) {
    console.error('Error fetching metadata:', error.message);
    return ''; // return empty string or a fallback image URL
  }
}

// Function to fetch image URL and Description from metadata URI
export async function fetchMetadata(metadataURI: string): Promise<{image: string; desc: string}> {
  try {
    const response = await fetch(metadataURI, {
        next: { revalidate: 600 } // Cache for 10 min
    });
    const metadata = await response.json();

    const data = {
        image: metadata.image,
        desc: metadata.description
    }
    
    return data || {image: "", desc: ""};
  } catch (error: any) {
    console.error('Error fetching metadata:', error.message);
    return {image: "", desc: ""}; // return empty string or a fallback image URL
  }
}

export async function getMomentById(tokenId: number) {
    return unstable_cache(
        async () => {
            const moment = await readContract(config as Config, {
                abi: RARE24_CONTRACT_ABI,
                address: RARE24_CONTRACT_ADDRESS as `0x${string}`,
                functionName: 'getPhotoDetails',
                args: [tokenId]
            }) as any;

            const [data, creator_fid] = await Promise.all([
                fetchMetadata(moment.metadataURI),
                getUserByUsername(moment.creator as string)
            ]);

            return {
                creator: moment.creator as string,
                creator_fid: creator_fid.success ? creator_fid?.fid : null,
                pfpUrl: moment.pfpUrl as string,
                imageUrl: data.image,
                desc: data.desc,
                created: formatDate(Number(moment.createdAt as string)),
                expires: Number(moment.expiresAt),
                totalMints: Number(moment.totalMinted),
                maxSupply: Number(moment.maxSupply),
                price: formatEther(moment.price)
            };
        },
        [`moment-by-id-${tokenId}`], // cache key
        {
            tags: [`moment-by-id-${tokenId}`],
            revalidate: 60 // Revalidate every 1 minute
        }
    )()
}

export async function getMomentSaleData(tokenId: number) {
    return unstable_cache(
        async () => {
            const currentTimestamp = Math.floor(Date.now() / 1000);

            // Fetch all base data in parallel
            const [lastSale, tokenListings, tokenOffers] = await Promise.all([
                readContract(config as Config, {
                    abi: MARKETPLACE_CONTRACT_ABI,
                    address: MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
                    functionName: 'getLastSale',
                    args: [tokenId]
                }) as Promise<bigint>,
                readContract(config as Config, {
                    abi: MARKETPLACE_CONTRACT_ABI,
                    address: MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
                    functionName: 'getTokenListings',
                    args: [tokenId]
                }) as Promise<bigint[]>,
                readContract(config as Config, {
                    abi: MARKETPLACE_CONTRACT_ABI,
                    address: MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
                    functionName: 'getTokenOffers',
                    args: [tokenId]
                }) as Promise<bigint[]>
            ]);

            // Process listings in parallel
            const listings = tokenListings.reverse();
            const listingPromises = listings.slice(0, 11).map(index =>
                readContract(config as Config, {
                    abi: MARKETPLACE_CONTRACT_ABI,
                    address: MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
                    functionName: 'getSaleListing',
                    args: [index]
                })
            );

            const listingResults = await Promise.all(listingPromises);
            
            const topListings = listingResults
                .filter((listing: any) => 
                    Number(listing.status) === 0 && 
                    currentTimestamp <= Number(listing.expiresAt)
                )
                .map((listing: any) => ({
                    id: Number(listing.listingId),
                    account: listing.sellerName as string,
                    amount: Number(listing.amount),
                    price: formatEther(listing.pricePerToken),
                    expires: getTimeRemaining(Number(listing.expiresAt))
                }));

            // Process offers in parallel
            const offers = tokenOffers.reverse();
            const offerPromises = offers.slice(0, 11).map(index =>
                readContract(config as Config, {
                    abi: MARKETPLACE_CONTRACT_ABI,
                    address: MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
                    functionName: 'getBuyOffer',
                    args: [index]
                })
            );

            const offerResults = await Promise.all(offerPromises);
            
            const topOffers = offerResults
                .filter((offer: any) => 
                    Number(offer.status) === 0 && 
                    currentTimestamp <= Number(offer.expiresAt)
                )
                .map((offer: any) => ({
                    id: Number(offer.offerId),
                    account: offer.buyerName as string,
                    amount: Number(offer.amount),
                    price: formatEther(offer.offerPerToken),
                    expires: getTimeRemaining(Number(offer.expiresAt))
                }));

            // Calculate derived values
            const least5 = [...topListings].sort((a, b) => Number(a.price) - Number(b.price)).slice(0, 5);
            const floor = topListings.length > 0 
                ? Math.min(...topListings.map(listing => Number(listing.price)))
                : 0;
            const buyNow = least5.length > 0 ? least5[0] : {
                id: 0,
                account: "_",
                amount: 0,
                price: "0",
                expires: "0"
            };

            const top5 = [...topOffers].sort((a, b) => Number(b.price) - Number(a.price)).slice(0, 5);
            const highestOffer = topOffers.length > 0 
                ? Math.max(...topOffers.map(listing => Number(listing.price)))
                : 0;

            return {
                lastSale: formatEther(lastSale),
                collectionFloor: floor,
                highestOffer: highestOffer,
                buyNow: buyNow,
                orders: top5,
                listings: least5
            };
        },
        [`moment-sale-data-${tokenId}`], // cache key
        {
            tags: [`moment-sale-data-${tokenId}`],
            revalidate: 60 // Revalidate every 1 minute
        }
    )()
}

export async function revalidateMomentData(tokenId: number) {
    revalidateTag(`moment-by-id-${tokenId}`, 'max')
    revalidateTag(`moment-sale-data-${tokenId}`, 'max')
}

export async function getUserBalance(tokenId: number, address: `0x${string}`) {
    const balance = await readContract(config as Config, {
        abi: RARE24_CONTRACT_ABI,
        address: RARE24_CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'balanceOf',
        args: [address, tokenId]
    }) as number;

    return balance;
}

export async function getCombined(tokenId: number) {
    // Execute all main functions in parallel
    const [data1, data2] = await Promise.all([
        getMomentById(tokenId),
        getMomentSaleData(tokenId)
    ]);

    return {
        moment: data1,
        sale: data2
    };
}

function getTimeRemaining(futureTimestamp: number) {
  // Get current time in seconds
  const now = Math.floor(Date.now() / 1000);
  
  // Calculate difference in seconds
  const diff = futureTimestamp - now;
  
  // If time has passed, return 0
  if (diff <= 0) {
    return "0s";
  }
  
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  
  // Return the largest non-zero unit
  if (days > 0) {
    return `${days}d`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}

export const getTokensListed = unstable_cache(
    async () => {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const MAX_LISTINGS = 20;

        // Fetch listing counter
        const listingCount = await readContract(config as Config, {
            abi: MARKETPLACE_CONTRACT_ABI,
            address: MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
            functionName: 'getListingIdCounter',
            args: []
        }) as bigint;

        const count = Number(listingCount);
        
        // Fetch listings in parallel batches
        const listingPromises = [];
        for (let i = count; i > 0 && listingPromises.length < MAX_LISTINGS * 2; i--) {
            listingPromises.push(
                readContract(config as Config, {
                    abi: MARKETPLACE_CONTRACT_ABI,
                    address: MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
                    functionName: 'getSaleListing',
                    args: [i]
                }).then(listing => ({ listing, id: i }))
            );
        }

        // Fetch all listings in parallel and filter
        const allListings = await Promise.all(listingPromises);
        const activeListings = allListings
            .filter(({ listing }: any) => 
                Number(listing.status) === 0 && 
                currentTimestamp <= Number(listing.expiresAt)
            )
            .slice(0, MAX_LISTINGS)
            .map(({ listing }) => listing);

        // Fetch NFT details in parallel
        const nftDetailsPromises = activeListings.map((listing: any) =>
            readContract(config as Config, {
                abi: RARE24_CONTRACT_ABI,
                address: RARE24_CONTRACT_ADDRESS as `0x${string}`,
                functionName: 'getPhotoDetails',
                args: [listing.tokenId]
            })
        );

        const detailsResults: any[] = await Promise.all(nftDetailsPromises);

        // Fetch metadata in parallel
        const metadataPromises = detailsResults.map((nft) => 
            fetchMetadata(nft.metadataURI)
        );

        const metadataResults: any[] = await Promise.all(metadataPromises);

        // Combine all data (FIX: your original had [0] instead of [i])
        return activeListings.map((listing: any, i: number) => ({
            listingId: Number(listing.listingId),
            tokenId: Number(listing.tokenId),
            seller: listing.sellerName as string,
            price: formatEther(BigInt(listing.pricePerToken)),
            amount: String(listing.amount),
            sold: String(listing.sold),
            creator: detailsResults[i].creator as string,
            pfpUrl: detailsResults[i].pfpUrl as string,
            imageUrl: metadataResults[i].image as string,
            desc: metadataResults[i].desc as string
        }));
    },
    ['getTokensListed'], // cache key
    {
        tags: ['marketplace-listings'],
        revalidate: 60 // Revalidate every 1 minute
    }
)

export async function revalidateMarketplace() {
  revalidateTag('marketplace-listings', 'max')
}

// Timestamp to "10h" or "34m"
function formatTime(deadlineTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const secondsRemaining = deadlineTimestamp - now;

  if (secondsRemaining <= 0) {
    return "0m";
  }

  const hoursRemaining = Math.floor(secondsRemaining / 3600);
  const minutesRemaining = Math.floor(secondsRemaining / 60);

  if (hoursRemaining > 0) {
    return `${hoursRemaining}h`;
  } else {
    return `${minutesRemaining}m`;
  }
}

export const getSharedMoments = unstable_cache(
    async () => {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const MAX_MOMENTS = 20;

        // fetch accounts following
        // const following = await getAllFollowings(fid)
        // const followingSet = new Set(following) 

        // Fetch listing counter
        const momentCount = await readContract(config as Config, {
            abi: RARE24_CONTRACT_ABI,
            address: RARE24_CONTRACT_ADDRESS as `0x${string}`,
            functionName: 'getTokenIdCounter',
            args: []
        }) as bigint;

        const count = Number(momentCount);
        
        // Fetch Moments in parallel batches
        const momentPromises = [];
        for (let i = count; i > 0 && momentPromises.length < MAX_MOMENTS * 3; i--) {
            momentPromises.push(
                readContract(config as Config, {
                    abi: RARE24_CONTRACT_ABI,
                    address: RARE24_CONTRACT_ADDRESS as `0x${string}`,
                    functionName: 'getPhotoDetails',
                    args: [i]
                }).then(moment => ({ moment, id: i }))
            );
        }

        // Fetch all listings in parallel and filter
        const allMoments = await Promise.all(momentPromises);
        const activeMoments: any[] = allMoments
            .filter(({ moment }: any) => {
                const isActive = currentTimestamp <= Number(moment.expiresAt)
                // const isFromFollowing = followingSet.has(moment.creator.toLowerCase());
                // return isActive && isFromFollowing
                return isActive
            })
            .slice(0, MAX_MOMENTS)
            .map(({ moment }) => moment);

        // Fetch metadata in parallel
        const metadataPromises = activeMoments.map((nft) => 
            fetchMetadata(nft.metadataURI)
        );
        const metadataResults: any[] = await Promise.all(metadataPromises);

        // First, get all unique creators
        const creators = [...new Set(activeMoments.map((m: any) => m.creator as string))];

        // Fetch all user data in parallel
        const userDataMap = new Map();
        await Promise.all(
            creators.map(async (creator) => {
                const userData = await getUserByUsername(creator);
                userDataMap.set(creator, userData.success ? userData?.fid : null);
            })
        );

        // Then map with the cached data
        return activeMoments.map((moment: any, i: number) => ({
            tokenId: Number(moment.tokenId),
            creator: moment.creator as string,
            creator_fid: userDataMap.get(moment.creator) as number || null,
            pfpUrl: moment.pfpUrl as string,
            price: formatEther(BigInt(moment.price)),
            amount: String(moment.maxSupply),
            sold: String(moment.totalMinted),
            imageUrl: metadataResults[i].image as string,
            desc: metadataResults[i].desc as string,
            expires: formatTime(Number(moment.expiresAt))
        }));
    },
    ['getSharedMoments'], // cache key
    {
        tags: ['shared-moments'],
        revalidate: 60 // Revalidate every 1 minute
    }
)

export async function revalidateFeed() {
  revalidateTag('getSharedMoments', 'max')
}

export async function getUserOffersListings(username: string) {
    return unstable_cache(
        async () => {
            const currentTimestamp = Math.floor(Date.now() / 1000);

            // Fetch all base data in parallel
            const [tokenListings, tokenOffers] = await Promise.all([
                readContract(config as Config, {
                    abi: MARKETPLACE_CONTRACT_ABI,
                    address: MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
                    functionName: 'getUsersListings',
                    args: [username]
                }) as Promise<bigint[]>,
                readContract(config as Config, {
                    abi: MARKETPLACE_CONTRACT_ABI,
                    address: MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
                    functionName: 'getUserOffers',
                    args: [username]
                }) as Promise<bigint[]>
            ]);

            // Process listings in parallel
            const listings = tokenListings.reverse();
            const listingPromises = listings.slice(0, 11).map(index =>
                readContract(config as Config, {
                    abi: MARKETPLACE_CONTRACT_ABI,
                    address: MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
                    functionName: 'getSaleListing',
                    args: [index]
                }).then((nft: any) => ({
                    type: 'Listing',
                    id: Number(nft.listingId),
                    tokenId: Number(nft.tokenId),
                    price: formatEther(nft.pricePerToken),
                    amount: Number(nft.amount),
                    sold_rec: Number(nft.sold),
                    expiresAt: formatTime(Number(nft.expiresAt)),
                    status: Number(nft.status)
                }))
            );
            const listingResults = await Promise.all(listingPromises);

            // Process offers in parallel
            const offers = tokenOffers.reverse();
            const offerPromises = offers.slice(0, 11).map(index =>
                readContract(config as Config, {
                    abi: MARKETPLACE_CONTRACT_ABI,
                    address: MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
                    functionName: 'getBuyOffer',
                    args: [index]
                }).then((nft: any) => ({
                    type: 'Offer',
                    id: Number(nft.offerId),
                    tokenId: Number(nft.tokenId),
                    price: formatEther(nft.offerPerToken),
                    amount: Number(nft.amount),
                    sold_rec: Number(nft.received),
                    expiresAt: formatTime(Number(nft.expiresAt)),
                    status: Number(nft.status)
                }))
            );
            const offerResults = await Promise.all(offerPromises);

            // merge arrays
            const mergeResults = [...listingResults, ...offerResults]

            // fetch Image & Urls
            const nftPromises = mergeResults.map(obj =>
                readContract(config as Config, {
                    abi: RARE24_CONTRACT_ABI,
                    address: RARE24_CONTRACT_ADDRESS as `0x${string}`,
                    functionName: 'getPhotoDetails',
                    args: [BigInt(obj.tokenId)]
                }).then(async (nft: any) => {
                    const metadata = await fetchMetadata(nft.metadataURI);
                    
                    return {
                        ...obj,
                        creator: nft.creator as string,
                        pfpUrl: nft.pfpUrl as string,
                        ...metadata
                    };
                })
            );

            return (await Promise.all(nftPromises)).filter(data => {
                const isExpired = currentTimestamp > Number(data.expiresAt);
                return data.type === 'Offer' 
                    ? ((data.status === 0 && !isExpired) || (data.status === 0 && isExpired))
                    : (data.status === 0 && !isExpired);
            });
        },
        [`user-offers-listings-${username}`], // cache key
        {
            tags: [`user-offers-listings-${username}`],
            revalidate: 60 // Revalidate every 1 minute
        }
    )()
}

export async function revalidateUserActivity(username: string) {
  revalidateTag(`user-offers-listings-${username}`, 'max')
}

export async function checkNotification(userAddress: `0x${string}`) {
    return unstable_cache(
        async () => {
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const MAX_OFFERS = 20;

            // get users holding
            const [offerCount, tokenIds] = await Promise.all([
                readContract(config as Config, {
                    abi: MARKETPLACE_CONTRACT_ABI,
                    address: MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
                    functionName: 'getOfferIdCounter',
                    args: []
                }) as Promise<bigint>,
                getUsersTokenIds(userAddress) as Promise<NFTDetails[]>
            ])

            const count = Number(offerCount);
            const userTokenIds = new Set(
                tokenIds.map(token => token.tokenId)
            )
            
            // Fetch listings in parallel batches
            const offerPromises = [];
            for (let i = count; i > 0 && offerPromises.length < MAX_OFFERS * 2; i--) {
                offerPromises.push(
                    readContract(config as Config, {
                        abi: MARKETPLACE_CONTRACT_ABI,
                        address: MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
                        functionName: 'getBuyOffer',
                        args: [i]
                    })
                );
            }

            // Fetch all listings in parallel and filter
            return (await Promise.all(offerPromises))
                .filter((offer: any) => 
                    offer &&
                    Number(offer.status) === 0 && 
                    currentTimestamp < Number(offer.expiresAt) &&
                    userTokenIds.has(Number(offer.tokenId))
                )
                .slice(0, MAX_OFFERS)
                .map((offer: any) => ({
                        tokenId: Number(offer.tokenId),
                        buyer: offer.buyerName as string,
                        imageUrl: tokenIds.find(obj => obj.tokenId)?.imageUrl || '',
                        price: formatEther(offer.offerPerToken)
                    })
                );
        },
        [`notify-${userAddress}`], // cache key
        {
            tags: [`notify-${userAddress}`],
            revalidate: 60 // Revalidate every 1 minute
        }
    )()
}