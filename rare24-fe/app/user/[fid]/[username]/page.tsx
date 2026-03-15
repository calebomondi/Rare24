import UserClient from "./client";
import { getCreatorMoments } from "@/app/blockchain/getterHooks";
import { getFarcasterUser } from "@/app/backend/farcasterUser";

interface PageProps {
  params: {
    fid: string,
    username: string
  }
}

export default async function UserPage({ params }: PageProps) {
  const { fid, username } = await params
  
  // Validate username
  if (!username || !fid) {
    throw new Error("ProfilePage: Missing Data")
  }

  try {
    // Fetch all data in parallel for better performance
    const [userMoments, userDetails] = await Promise.all([
      getCreatorMoments(username, process.env.PLACEHOLDER as `0x${string}`),
      getFarcasterUser(Number(fid))
    ])

    if(!userMoments) {
      throw new Error("UserMoments: Data not loaded!")
    }

    return(
      <UserClient 
        parsedMoments={userMoments}
        user={userDetails}
      />
    )
  } catch (error) {
    console.error('Error Users Moments & Data:', error)
    return(
      <UserClient 
        parsedMoments={{
          Nfts: [],
          mints: 0,
          earning:"0"
        }}
        user={null}
      />
    )
  } 
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params
  
  return {
    title: `${username}'s Profile`,
    description: `View ${username}'s NFT moments`
  }
}
