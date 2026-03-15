"use client"

import { useState, useEffect } from "react";
import { LoaderCircle, CircleX, CircleCheck } from "lucide-react";
import { useFarcasterStore } from "@/app/store/useFarcasterStore";
import { CreatorNftData, NFTDetails, UserOfferlistings } from "@/app/types/index.t";
import { Config, useConnection } from 'wagmi'
import { useRouter } from "next/navigation";
import { simulateContract, writeContract, waitForTransactionReceipt } from "@wagmi/core"
import { MARKETPLACE_CONTRACT_ABI, MARKETPLACE_CONTRACT_ADDRESS } from "@/app/blockchain/core";
import { config } from "@/utils/wagmi";
import { revalidateUserActivity, revalidateMarketplace, revalidateMomentData } from "@/app/blockchain/getterHooks";

interface Props {
    activity: UserOfferlistings[],
    parsedMoments: CreatorNftData,
    parsedUserNfts: NFTDetails[]
}

export default function ProfileClient(
    {
      activity,
      parsedMoments,
      parsedUserNfts
    } : Props
) {
  const { isConnected, address } = useConnection()
  const user = useFarcasterStore((state) => state.user)
  const route = useRouter()

  const [activeTab, setActiveTab] = useState<"moments" | "holding" | "activity">("moments")
  const [moments, setMoments] = useState<CreatorNftData | null>(null)
  const [userNfts, setUserNfts] = useState<NFTDetails[]>([])
  const [displayItems, setDisplayItems] = useState<NFTDetails[]>([])
  const [parsedActivity, setActivity] = useState<UserOfferlistings[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [success, setSuccess] = useState(false)
  const [process, setProcess] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // set initialActivity
  useEffect(() => {
    setActivity(activity)
    setMoments(parsedMoments)
    setUserNfts(parsedUserNfts)
  }, [])

  // Update displayItems
  useEffect(() => {
    if(activeTab === "moments"){
      setDisplayItems(moments?.Nfts ?? [])
    } else if(activeTab === "holding") {
      setDisplayItems(userNfts)
    }
  }, [activeTab, moments, userNfts])

  const handleCancel = async(type: string, id: number, tokenId: number) => {
    let didSucceed = false

    try{
      setProcess(true)

      const { request } = await simulateContract(config as Config, {
        abi: MARKETPLACE_CONTRACT_ABI,
        address: MARKETPLACE_CONTRACT_ADDRESS,
        functionName: type == 'Offer' ? 'cancelBuyOffer' : 'cancelListing',
        args: [BigInt(id)]
      })
      const hash = await writeContract(config as Config, request)
      const receipt = await waitForTransactionReceipt(config as Config, { hash });

      if (!receipt) throw new Error("Couldn't Cancel!")
      
      didSucceed = true
      setProcess(false)
      setSuccess(true)

      // revalidate user activity
      await revalidateUserActivity(address as `0x${string}`)
      // revalidate moment data
      await revalidateMomentData(tokenId)
      // revalidate marketplace data
      if(type != 'Offer')
        await revalidateMarketplace()

    } catch(error) {
      console.error("Error: ", error)
      setProcess(false)
      setError(true)
    } finally {
      setTimeout(() => {
        setSelectedId(null)
        setSuccess(false)
        if(didSucceed) {
          route.refresh()
        }
        setError(false)
      }, 5000)
    }
  }

  const handleRefund = async(id: number) => {
    let didSucceed = false

    try{
      setProcess(true)

      const { request } = await simulateContract(config as Config, {
        abi: MARKETPLACE_CONTRACT_ABI,
        address: MARKETPLACE_CONTRACT_ADDRESS,
        functionName: 'refundBuyOffer',
        args: [BigInt(id)]
      })
      const hash = await writeContract(config as Config, request)
      const receipt = await waitForTransactionReceipt(config as Config, { hash });

      if (!receipt) throw new Error("Couldn't Refund!")
      
      didSucceed = true
      setProcess(false)
      setSuccess(true)

      // revalidate user activity
      await revalidateUserActivity(address as `0x${string}`)

    } catch(error) {
      console.error("Error: ", error)
      setProcess(false)
      setError(true)
    } finally {
      setTimeout(() => {
        setSelectedId(null)
        setSuccess(false)
        if(didSucceed) {
          route.refresh()
        }
        setError(false)
      }, 5000)
    }
  }

  return (
    <main className="mt-20 mb-16">
      <div className="w-full max-w-md">
        {/* User Profile Card */}
        <div className="bg-card p-4">
          {/* Header Section */}
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="w-24 h-24 rounded-full border-2 border-teal-50 flex-shrink-0">
              <img 
                src={user?.pfpUrl} 
                alt={user?.displayName} 
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="">
                <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">{moments?.Nfts.length ?? 0}</p>
                <p className="text-lg text-gray-700 dark:text-gray-400">Moments</p>
              </div>
              <div className="">
                <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">{moments?.mints ?? 0}</p>
                <p className="text-lg text-gray-700 dark:text-gray-400">Mints</p>
              </div>
              <div className="">
                <div className="flex items-center gap-1">
                  <img 
                    src="/eth_light.png" 
                    alt="eth-light"
                    className="w-3 object-cover hidden dark:block"
                  />
                  <img 
                    src="/eth_dark.png" 
                    alt="eth-dark"
                    className="w-5 object-cover dark:hidden"
                  />
                  <p className="text-lg font-semibold">
                    <span className="font-semibold">
                      {moments?.earning ?? 0}
                    </span>
                  </p>
                </div>
                <p className="text-lg text-gray-700 dark:text-gray-400">Earning</p>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="">
            <h2 className="font-semibold text-lg text-foreground">{user?.username}</h2>
            <p className="text-md text-muted-foreground">{user?.bio}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-border border-gray-600 mt-3" />

        {/* Moments and Holding Card */}
        <div className="bg-card p-4">
          {/* Tabs */}
          <div className="flex items-center justify-center gap-8 mb-6 border-b border-teal-500/20">
            <button
              onClick={() => setActiveTab("moments")}
              className={`pb-3 text-lg font-medium transition-colors ${
                activeTab === "moments"
                  ? "text-teal-700 border-b-2 border-teal-600 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Moments
            </button>
            <button
              onClick={() => setActiveTab("holding")}
              className={`pb-3 text-lg font-medium transition-colors ${
                activeTab === "holding"
                  ? "text-teal-700 border-b-2 border-teal-600 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Holding
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`pb-3 text-lg font-medium transition-colors ${
                activeTab === "activity"
                  ? "text-teal-700 border-b-2 border-teal-600 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Activity
            </button>
          </div>

          {/* Grid of Items */}
          <div className="">
            {
              (displayItems.length ?? 0)> 0 && (activeTab == 'moments'  || activeTab == 'holding') ? (
                <div className="grid grid-cols-2 gap-1">
                  {
                    displayItems.map((item) => (
                      <div
                        key={item.tokenId}
                        onClick={() => route.push(`/nft/${item.tokenId}/${address}`)}
                        className="aspect-square rounded-md border-2 border-foreground/20 hover:border-foreground/40 transition-colors bg-card cursor-pointer relative overflow-hidden"
                      >
                        <img 
                          src={item.imageUrl} 
                          alt={item.imageUrl} 
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Fade away shadow at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-30 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
                        
                        {/* Number at bottom left */}
                        <div className="absolute bottom-1 left-1 text-white font-semibold text-xl z-10">
                          {item.totalMint_balance}
                        </div>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <>
                  {
                    (parsedActivity?.length ?? 0) > 0 && activeTab == 'activity' ? (
                      <div className="">
                        {
                          activity.map((item, index) => (
                            <div 
                              className="flex gap-4 border-b border-gray-500/30 py-5"
                              key={`${item.type}_${item.id}`}
                            >
                              {/* Image on the left - perfect square */}
                              <div className="relative aspect-square w-32 grid place-items-center shrink-0 overflow-hidden rounded-md">
                                <img 
                                  src={item.image || "/placeholder.svg"} 
                                  alt={item.id.toString()} 
                                  className="object-cover" 
                                  onClick={() => route.push(`/nft/${item.tokenId}/${address}`)}
                                />
                              </div>

                              {/* Data on the right */}
                              <div className="flex flex-1 flex-col justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <img 
                                        src={item?.pfpUrl} 
                                        alt={item?.creator}
                                        className="w-6 h-6 object-cover rounded-full"
                                      />
                                      <span className="text-lg font-semibold">{item?.creator}</span>
                                    </div>
                                    <span>
                                      {item.expiresAt}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-sm">

                                    <div className="flex flex-col items-center">
                                      <span className="text-lg">Price</span>
                                      <span className="text-lg font-semibold">{item.price} ETH</span>
                                    </div>

                                    <div className="flex flex-col items-center">
                                      <span className="text-lg">Amount</span>
                                      <span className="text-lg font-semibold">{item.amount}</span>
                                    </div>

                                    <div className="flex flex-col items-center">
                                      <span className="text-lg">{item.type === 'Offer' ? "Received" : "Sold"}</span>
                                      <span className="text-lg font-semibold">{item.sold_rec}</span>
                                    </div>
                                  </div>
                                </div>

                                {
                                  selectedId === index && (
                                    <div className="p-5">
                                      {
                                        process && (
                                          <div className="text-center text-blue-200 rounded-lg bg-blue-500 flex flex-col gap-1 py-2 font-semibold text-lg">
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
                                            <span className="">Failed</span>
                                          </div>
                                        )
                                      }
                                      {
                                        success && (
                                          <div className="text-center text-green-100 rounded-lg bg-green-600 flex flex-col gap-1 items-center justify-center py-2 text-lg font-semibold ">
                                            <span className="flex items-center justify-center">
                                              <CircleCheck size={35} className="text-white" />
                                            </span>
                                            <span className="">Succeded</span>
                                          </div>
                                        )
                                      }
                                    </div>
                                  )
                                }

                                {/* Action buttons */}
                                <div className={`mt-2 p-2 flex items-center gap-2 ${((selectedId === index) && (success || error || process)) && 'hidden'}`}>
                                  {item.type === "Offer" && item.status === 0 && item.expiresAt === "0m" && (
                                    <button 
                                      onClick={ async() => {
                                        if(!isConnected) return
                                        setSelectedId(index)
                                        await handleRefund(item.id)
                                      }}
                                      disabled={success || error || process}
                                      className={`w-full text-lg bg-orange-500 text-white text-center px-3 py-2 rounded-full`}
                                    >
                                      Refund
                                    </button>
                                  )}
                                  <button
                                    onClick={ async() => {
                                      if(!isConnected) return
                                      setSelectedId(index)
                                      await handleCancel(item.type, item.id, item.tokenId)
                                    }}
                                    disabled={success || error || process}
                                    className={`w-full text-lg bg-blue-500 text-white text-center px-3 py-2 rounded-full ${item.expiresAt === "0m" && "hidden"}`}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center mt-20">
                        {
                          loading ? (
                            <span className="animate-spin">
                              <LoaderCircle size={60} className="text-teal-500/80"/>
                            </span>
                          ) : (
                            <>
                              <div className="flex items-center justify-center">
                                <div className="flex flex-col items-center justify-center">
                                  <div className="relative aspect-square w-30 grid place-items-center shrink-0 overflow-hidden rounded-md">
                                    <img 
                                      src={"/empty-box.png"} 
                                      alt={"Empty Box"} 
                                      className="object-cover"
                                    />
                                  </div>
                                  <span className="text-lg text-teal-600/80">
                                    {activeTab == 'holding' && "You Own Zero Moments"}
                                    {activeTab == 'moments' && "You've Shared Zero Moments"}
                                    {activeTab == 'activity' && "You've Made No Offers or Listings"}
                                  </span>
                                </div>
                              </div>
                            </>
                          )
                        }
                      </div>
                    )
                  }
                  
                </>
              )
            }
          </div>
        </div>
      </div>
    </main>
  );
}
