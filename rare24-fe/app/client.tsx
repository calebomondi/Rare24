"use client"

import { useEffect, useState } from "react";
import { getFarcasterUser } from "./backend/farcasterUser";
import { sdk } from "@farcaster/miniapp-sdk"
import { useFarcasterStore } from "./store/useFarcasterStore";
import { config } from "@/utils/wagmi";
import { simulateContract, writeContract, waitForTransactionReceipt } from "@wagmi/core"
import { Config, useConnection, useConnect, useConnectors, useBalance } from "wagmi";
import { RARE24_CONTRACT_ABI, RARE24_CONTRACT_ADDRESS } from "./blockchain/core";
import { parseEther, formatEther } from "viem";
import { LoaderCircle, Heart, CircleCheck, CircleX } from "lucide-react";
import { SharedMoments } from "./types/index.t";
import { getEthPrice } from "./backend/price";
import { useRouter } from "next/navigation";
import OnboardingFlow from "./components/onboarding";
import { revalidateFeed } from "./blockchain/getterHooks";
import { revalidateUsersNfts } from "./backend/alchemy";

export default function HomeClient({ sharedMoments } : { sharedMoments: SharedMoments[] }) {
  const { setUser, setLoading } = useFarcasterStore()
  const router = useRouter()
  const { isConnected, address } = useConnection()
  const { connect } = useConnect()
  const connectors = useConnectors()
  const { data } = useBalance({ address })

  const [userName, setUserName] = useState('')
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [inUsd, setInUsd] = useState("0")
  const [showOnboarding, setShowOnboarding] = useState(false)

  // console.log("Rendering HomeClient with moments:", JSON.stringify(sharedMoments[0].creator));

  // fetch user's ETH balance
  const ethBalance = data ? Number(formatEther(data.value)) : 0

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    
    // Show onboarding if:
    // 1. Haven't seen it before
    // 2. Wallet not connected
    if (!hasSeenOnboarding && !isConnected) {
      setShowOnboarding(true);
    }
  }, [isConnected]);

  const handleOnboardingComplete = async () => {
    // Mark as seen
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
    
    // Auto-connect wallet
    try {
      connect({ connector: connectors[0] });
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  // Refresh on address change
  useEffect(() => {
    setTimeout(() => {
      router.refresh()
    }, 2000)
  }, [address])

  // fetch farcaster data
  useEffect(() => {
    // farcaster user data
    const getUser = async() => {
      let userFid: number | null = null

      // Try to get FID from Frame SDK first
      try {
        const context = await sdk.context
        userFid = context.user?.fid || null
      } catch (error) {
        console.log('Not in Farcaster context')
      }

      // Fallback to mock FID if not in Farcaster
      if (!userFid && process.env.NEXT_PUBLIC_MOCK_FID) {
        userFid = parseInt(process.env.NEXT_PUBLIC_MOCK_FID)
        console.log('Using mock FID:', userFid)
      }

      try {
        if(userFid) {
          const userData = await getFarcasterUser(userFid)
          if(userData) {
            setUser(userData)
            setUserName(userData.username)
          }
        }
      } catch (error) {
        console.error('Error loading Farcaster user:', error)
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [])

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
  const handleBuyNow = async (tokenId:number, price: string) => {    
    let didSucceed = false

    try{
      setIsLoading(true)

      const { request } = await simulateContract(config as Config, {
        abi: RARE24_CONTRACT_ABI,
        address: RARE24_CONTRACT_ADDRESS,
        functionName: 'mintPhoto',
        args: [BigInt(tokenId), userName],
        value: parseEther(price)
      })
      const hash = await writeContract(config as Config, request)
      const receipt = await waitForTransactionReceipt(config as Config, { hash });

      if (!receipt) throw new Error("Couldn't Buy NFT!")
      // await new Promise(resolve => setTimeout(resolve, 5000));
      
      didSucceed = true
      setIsLoading(false)
      setSuccess(true)

      // revalidate feed data
      await revalidateFeed()
      // revalidate user's nfts
      await revalidateUsersNfts(address as `0x${string}`)

    } catch(error) {
      console.error("handleBuyNFT: ", error)
      setIsLoading(false)
      setError("Couldn't Buy NFT!")
    } finally {
      setTimeout(() => {
        setError("")
        setSuccess(false)
        setSelectedId(null)
        if(didSucceed) {
          router.refresh()
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
  if (!sharedMoments || sharedMoments.length === 0) {
    return (
      <>
        {
          showOnboarding && (
            <OnboardingFlow onComplete={handleOnboardingComplete} />
          )
        }
        <div className="flex items-center justify-center my-16" style={{ minHeight: 'calc(100vh - 8rem)' }}>
          <div className="flex flex-col items-center justify-center">
            <div className="relative aspect-square w-30 grid place-items-center shrink-0 overflow-hidden rounded-md">
              <img src="/empty-box.png" alt="Empty Box" className="object-cover" />
            </div>
            <span className="text-lg font-semibold text-teal-600/80">No Moments Shared Yet!</span>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className={`my-16`}>
      {
        showOnboarding && (
          <OnboardingFlow onComplete={handleOnboardingComplete} />
        )
      }
      {
        sharedMoments?.map((moment) => {
          return(
            <div className="border-b border-gray-500/30" key={moment.tokenId}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div 
                  className="flex items-center gap-3"
                  onClick={() => router.push(`/user/${moment.creator_fid ?? ''}/${moment.creator}`)}
                >
                  <img 
                    src={moment?.pfpUrl} 
                    alt={moment?.creator}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span className="text-gray-700 dark:text-gray-300 font-semibold text-lg">{moment?.creator}</span>
                </div>
                
                <span className="text-gray-700 dark:text-gray-300 text-md">{moment?.expires}</span>
              </div>
              {/* Image */}
              <div 
                  className="flex items-center justify-center relative overflow-hidden"
                  style={{ maxHeight: '65vh' }}
                  onClick={() => router.push(`nft/${moment.tokenId}/${address}`)}
              >
                  {/* Blurred background */}
                  <div 
                      className="absolute inset-0 bg-cover bg-center blur-2xl scale-110"
                      style={{ backgroundImage: `url(${moment?.imageUrl})` }}
                  />
                  
                  {/* Actual image */}
                  <img 
                      src={moment?.imageUrl} 
                      alt={moment?.creator}
                      className="max-h-[65vh] w-auto h-auto object-contain relative z-10"
                  />
              </div>
              {/* Moment Details */}
              <div className="flex items-center justify-between px-4 py-3 text-gray-700 dark:text-gray-300">
                  <div 
                      className="flex items-center justify-even gap-2"
                      onClick={async() => {
                        if(isConnected) {
                          setSelectedId(moment.tokenId)
                          if(ethBalance < Number(moment.price)) 
                            handleInsufficientFunds()
                          else
                            await handleBuyNow(moment.tokenId, moment.price)
                        }
                      }}
                  >
                      <Heart size={25} className="text-red-500"/>
                      <span className="text-lg font-semibold">{moment?.sold}/{moment?.amount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                      <img 
                          src="/eth_light.png" 
                          alt={moment?.creator}
                          className="w-3 object-cover hidden dark:block"
                      />
                      <img 
                          src="/eth_dark.png" 
                          alt={moment?.creator}
                          className="w-5 object-cover dark:hidden"
                      />
                      <p className="text-lg font-semibold">
                          <span className="font-semibold">
                              {moment?.price}, ${(Number(moment?.price) * Number(inUsd)).toFixed(2)}
                          </span>
                      </p>
                  </div>
              </div>
              {
                selectedId === moment.tokenId && (
                    <div className="p-5">
                      {
                        isLoading && (
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
              <div className="px-4 pb-8 space-y-2 text-gray-700 dark:text-gray-300">
                  <p className="text-lg">{moment?.desc}</p>
              </div>
            </div>
          )
        })
      }
    </div>
  );
}
