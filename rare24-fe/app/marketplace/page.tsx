import { getTokensListed } from "../blockchain/getterHooks"
import MarketplaceClient from "./client"

export default async function MarketplacePage() {
  try {
    const listings = await getTokensListed()
  
    return <MarketplaceClient listedTokens={listings} />
  } catch (error) {
    console.error('Error fetching Listings:', error)
    return(
      <MarketplaceClient listedTokens={[]} />
    )
  }
}

export async function generateMetadata() {
 
  return {
    title: "Marketplace",
    description: `View Listed NFTs`
  }
}