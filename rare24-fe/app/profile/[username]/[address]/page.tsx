import ProfileClient from "./client";
import { getUserOffersListings, getCreatorMoments } from "@/app/blockchain/getterHooks";
import { getUsersTokenIds } from "@/app/backend/alchemy";

interface PageProps {
  params: {
    username: string,
    address: string
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const { username, address } = await params
  
  // Validate username
  if (!username || !address) {
    throw new Error("ProfilePage: Missing Data")
  }

  try {
    // Fetch all data in parallel for better performance
    const [offers_listings, userMoments, userNfts] = await Promise.all([
      getUserOffersListings(username),
      getCreatorMoments(username, address as `0x${string}`),
      getUsersTokenIds(address as `0x${string}`)
    ])

    if(!offers_listings || !userMoments || !userNfts) {
      throw new Error("ProfilePage: Data not loaded!")
    }

    return(
      <ProfileClient 
        activity={offers_listings} 
        parsedMoments={userMoments}
        parsedUserNfts={userNfts}
      />
    )
  } catch (error) {
    console.error('Error Users Offers & Listings:', error)
    return(
      <ProfileClient 
        activity={[]} 
        parsedMoments={{
          Nfts: [],
          mints: 0,
          earning:"0"
        }}
        parsedUserNfts={[]}
      />
    )
  } 
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params
  
  return {
    title: `${username}'s Profile`,
    description: `View ${username}'s NFT moments, collection and activity`
  }
}
