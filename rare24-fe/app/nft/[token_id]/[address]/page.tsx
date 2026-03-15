import NFTDetailsClient from "./client"
import { getCombined } from "@/app/blockchain/getterHooks"
import { notFound } from "next/navigation"
import { getUserBalance } from "@/app/blockchain/getterHooks"

export default async function NFTDetailsPage({ params }: { params: { token_id: string, address: string } }) {
  // params.tokenId is automatically extracted from the URL
  // URL: /nft/123 → params.tokenId = "123"
  // URL: /nft/456 → params.tokenId = "456"
  console.log("NFTDetailsPage re-rendered", Date.now())
  
  const { token_id, address } = await params

  // Validate tokenId
  if (isNaN(Number(token_id)) || Number(token_id) <= 0 || !address) {
    notFound() // Shows 404 page
  }

  try {
    // Fetch NFT data using the tokenId
    const [data, balance] = await Promise.all([
      getCombined(Number(token_id)),
      getUserBalance(Number(token_id), address as `0x${string}`)
    ])

    if (!data.moment || !data.sale) {
      notFound()
    }
    
    return (
        <NFTDetailsClient 
          tokenId={Number(token_id)}
          balance={balance}
          moment={data.moment}
          momentSale={data.sale}
        />
    )
  } catch (error) {
    console.error('Error fetching NFT:', error)
    return <div 
            className="flex items-center justify-center my-16" 
            style={{ minHeight: 'calc(100vh - 8rem)' }}
        >
            <span className="text-lg text-teal-600/80">Error loading NFT</span>
        </div>
  }

}

export async function generateMetadata() {
 
  return {
    title: "NFT Details",
    description: `View NFT Details and Trade Activity!`
  }
}