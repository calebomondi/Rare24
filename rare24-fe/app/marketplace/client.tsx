"use client"

import { Heart, CircleCheck, LoaderCircle, Grid2x2X, CircleX } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { config } from "@/utils/wagmi"
import { simulateContract, writeContract, waitForTransactionReceipt } from "@wagmi/core"
import { parseEther, formatEther } from "viem"
import { Config, useConnection, useBalance } from "wagmi"
import { MARKETPLACE_CONTRACT_ABI, MARKETPLACE_CONTRACT_ADDRESS } from "../blockchain/core"
import { useFarcasterStore } from "../store/useFarcasterStore"
import { TokenListings } from "../types/index.t"
import { getEthPrice } from "../backend/price"
import { revalidateMarketplace } from "../blockchain/getterHooks"
import { revalidateUsersNfts } from "../backend/alchemy"

export default function MarketplaceClient({ listedTokens } : { listedTokens: TokenListings[] }) {
  const route = useRouter()
  const { isConnected, address } = useConnection()
  const user = useFarcasterStore((state) => state.user)
  const { data } = useBalance({ address })

  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [inUsd, setInUsd] = useState("0")

  // console.log("Rendering MarketplaceClient with moments:", JSON.stringify(listedTokens[0]?.creator));

  // fetch user's ETH balance
  const ethBalance = data ? Number(formatEther(data.value)) : 0

  // Refresh on address change
  useEffect(() => {
      setTimeout(() => {
          route.refresh()
      }, 2000)
  }, [address])

  // ETH to USD
  useEffect(() => {
    const ethInUsd = async () => {
      const usdPrice = await getEthPrice()
      if(usdPrice) {
        setInUsd(usdPrice.toFixed(2))
      } 
      // console.log(`moment: ${JSON.stringify(sharedMoments)}`)
    }

    ethInUsd()
  }, []);

  // Buy NFT
  const handleBuyNow = async (listingId:number, price: string) => {   
    let didSucceed = false

    try{
      setLoading(true)

      const { request } = await simulateContract(config as Config, {
        abi: MARKETPLACE_CONTRACT_ABI,
        address: MARKETPLACE_CONTRACT_ADDRESS,
        functionName: 'buyListing',
        args: [BigInt(listingId), user?.username],
        value: parseEther(price)
      })
      const hash = await writeContract(config as Config, request)
      const receipt = await waitForTransactionReceipt(config as Config, { hash });

      if (!receipt) throw new Error("Couldn't Buy NFT!")
      // await new Promise(resolve => setTimeout(resolve, 5000));
      
      didSucceed = true
      setLoading(false)
      setSuccess(true)

      // revalidate marketplace data
      await revalidateMarketplace()
      // revalidate user's nfts
      await revalidateUsersNfts(address as `0x${string}`)

    } catch(error) {
      console.error("handleAcceptOffer: ", error)
      setLoading(false)
      setError("Couldn't Buy NFT!")
    } finally {
      setTimeout(() => {
        setError("")
        setSuccess(false)
        setSelectedId(null)
        if(didSucceed) {
          route.refresh()
        }
      }, 5000)
    }
  }

  // Handle insufficient funds
  const handleInsufficientFunds = () => {
    setError("Insufficient ETH Balance!")
    setTimeout(() => {
      setError("")
      setSelectedId(null)
    }, 5000)
  }

  // No NFT found
  if (!listedTokens || listedTokens.length === 0) {
    return (
      <div className="flex items-center justify-center my-16" style={{ minHeight: 'calc(100vh - 8rem)' }}>
        <div className="flex flex-col items-center justify-center">
          <div className="relative aspect-square w-30 grid place-items-center shrink-0 overflow-hidden rounded-md">
            <img src="/empty-box.png" alt="Empty Box" className="object-cover" />
          </div>
          <span className="text-lg font-semibold text-teal-600/80">No NFT Listed Yet!</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`my-16`}>
        {
            listedTokens?.map((listing) => {
                return(
                    <div className="border-b border-gray-500/30" key={listing.listingId}>
                        {/* Image */}
                        <div 
                            className="flex items-center justify-center relative overflow-hidden"
                            style={{ maxHeight: '60vh' }}
                            onClick={() => {
                            route.push(`nft/${listing.tokenId}/${address}`)
                            }}
                        >
                            {/* Blurred background */}
                            <div 
                            className="absolute inset-0 bg-cover bg-center blur-2xl scale-110"
                            style={{ backgroundImage: `url(${listing?.imageUrl})` }}
                            />
                            
                            {/* Actual image */}
                            <img 
                            src={listing?.imageUrl} 
                            alt={listing?.creator}
                            className="max-h-[60vh] w-auto h-auto object-contain relative z-10"
                            />
                        </div>
                        {/* Moment Details */}
                        <div className="flex items-center justify-between px-4 py-3 text-gray-700 dark:text-gray-300">
                            <div className="font-semibold">
                                <div className="flex items-center gap-2">
                                    <img 
                                        src={listing?.pfpUrl} 
                                        alt={listing?.creator}
                                        className="w-6 h-6 object-cover rounded-full"
                                    />
                                    <p>
                                    <span className="text-lg font-semibold">{listing?.creator} </span>
                                    <span className="font-italic">by</span>
                                    <span className="text-lg font-semibold"> {listing?.seller}</span>
                                    </p>
                                </div>
                            </div>
                            <div 
                                className="flex items-center justify-even gap-2"
                                onClick={async() => {
                                  if(isConnected) {
                                    setSelectedId(listing.listingId)
                                    if(ethBalance < Number(listing.price)) 
                                      handleInsufficientFunds()
                                    else
                                      await handleBuyNow(listing.listingId, listing.price)
                                  }
                                }}
                            >
                                <Heart size={25} className="text-red-500"/>
                                <span className="text-lg font-semibold">{listing?.sold}/{listing?.amount}</span>
                            </div>
                        </div>
                        {/* Transaction Status */}
                        {
                            selectedId === listing.listingId && (
                            <div className="p-5">
                                {
                                loading && (
                                    <div className="text-center text-blue-200 rounded-lg bg-blue-500 flex flex-col gap-1 py-2 font-semibold text-lg">
                                    <span className="text-lg text-white">Buying NFT ...</span>
                                    <span className="flex items-center justify-center">
                                        <LoaderCircle size={35} className="animate-spin text-white" />
                                    </span>
                                    </div>
                                )
                                }
                                {
                                error && (
                                    <div className="text-center text-red-100 rounded-lg bg-red-500 flex flex-col gap-1 py-2 font-semibold text-lg">
                                    <span className="flex items-center justify-center">
                                        <CircleX size={35} className="text-white" />
                                    </span>
                                    <span className="">{error}</span>
                                    </div>
                                )
                                }
                                {
                                success && (
                                    <div className="text-center text-green-100 rounded-lg bg-green-600 flex flex-col gap-1 items-center justify-center py-2 text-lg font-semibold ">
                                    <span className="flex items-center justify-center">
                                        <CircleCheck size={35} className="text-white" />
                                    </span>
                                    <span className="">NFT Bought</span>
                                    </div>
                                )
                                }
                            </div>
                            )
                        }
                        {/* Desc & Price */}
                        <div className="px-4 pb-8 space-y-2 text-gray-700 dark:text-gray-300">
                            <p className="text-lg">{listing?.desc}</p>
                            <div className="flex items-center gap-1">
                                <img 
                                    src="/eth_light.png" 
                                    alt={listing.imageUrl}
                                    className="w-3 object-cover hidden dark:block"
                                />
                                <img 
                                    src="/eth_dark.png" 
                                    alt={listing.imageUrl}
                                    className="w-5 object-cover dark:hidden"
                                />
                                <p className="text-lg font-semibold">
                                    <span className="font-semibold">
                                        {listing?.price}
                                    </span>
                                    <span>
                                        , ${(Number(listing?.price) * Number(inUsd)).toFixed(2)}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                )
            })
        }
    </div>
  )
}
