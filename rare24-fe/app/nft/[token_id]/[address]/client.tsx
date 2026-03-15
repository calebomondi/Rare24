"use client"

import { useEffect, useState } from "react";
import { Heart, LoaderCircle, CircleCheck, CircleX } from 'lucide-react';
import OrdersListingTable from "@/app/components/orders-listing-table";
import { getUserBalance } from "@/app/blockchain/getterHooks";
import { MomentDetails, MomentsSaleData } from "@/app/types/index.t";
import { useFarcasterStore } from "@/app/store/useFarcasterStore";
import { useConnection, Config, useBalance } from "wagmi";
import Modal from "@/app/components/modal";
import { simulateContract, writeContract, waitForTransactionReceipt } from '@wagmi/core'
import { config } from "@/utils/wagmi"
import { MARKETPLACE_CONTRACT_ABI, MARKETPLACE_CONTRACT_ADDRESS } from "@/app/blockchain/core";
import { parseEther, formatEther } from "viem";
import { getEthPrice } from "@/app/backend/price";
import { useRouter } from "next/navigation";
import { revalidateMomentData, revalidateMarketplace, revalidateUserActivity } from "@/app/blockchain/getterHooks";
import { revalidateUsersNfts } from "@/app/backend/alchemy";

interface Props {
    tokenId: number,
    balance: number,
    moment: MomentDetails,
    momentSale: MomentsSaleData
}

export default function NFTDetailsClient(
    {
        tokenId,
        balance,
        moment,
        momentSale
    } : Props
) {
    const user = useFarcasterStore((state) => state.user)
    const { address, isConnected } = useConnection()
    const { data } = useBalance({ address })
    const route = useRouter()

    const [isHandLoading, setIsHandLoading] = useState(false)
    const [offering, setOffering] = useState(true)
    const [listing, setListing] = useState(false)
    const [accOffer, setAccOffer] = useState(false)
    const [inUsd, setInUsd] = useState("0")
    const [price, setPrice] = useState("");
    const [emptyPrice, setEmptyPrice] = useState(false)
    const [amount, setAmount] = useState("");
    const [emptyAmount, setEmptyAmount] = useState(false)
    const [activeTab, setActiveTab] = useState("orders")
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false)
    const [selectedId, setSelectedId] = useState<number | null>(null)

    const tabs = [
        { id: "orders", label: "Orders" },
        { id: "listing", label: "Listings" },
        // { id: "activity", label: "Activity" },
    ]

    // fetch user's ETH balance
    const ethBalance = data ? Number(formatEther(data.value)) : 0

    const handleBuyNow = async () => {
        setIsHandLoading(true)

        // 
        const price = momentSale?.buyNow.price ?? '0'
        const listingId = momentSale?.buyNow.id ?? 0

        let didSucceed = false
        
        try{
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
            
            didSucceed = true
            setIsHandLoading(false)
            setSuccess(true)

            // revalidate moment data
            await revalidateMomentData(tokenId)
            // revalidate marketplace data
            await revalidateMarketplace()
            // revalidate user's nfts
            await revalidateUsersNfts(address as `0x${string}`)

        } catch(error) {
            console.error("handleAcceptOffer: ", error)
            setIsHandLoading(false)
            setError("Couldn't Buy NFT!")
        } finally {
            setTimeout(() => {
                setError("")
                setSuccess(false)
                if(didSucceed) {
                    route.refresh()
                }
            }, 5000)
        }

    }

    const handleMakeOffer = async () => {
        setIsHandLoading(true)

        const deposit = Number(amount) * Number(price)
        let didSucceed = false
        try{
            const { request } = await simulateContract(config as Config, {
                abi: MARKETPLACE_CONTRACT_ABI,
                address: MARKETPLACE_CONTRACT_ADDRESS,
                functionName: 'makeBuyOffer',
                args: [user?.username, BigInt(tokenId), BigInt(amount), parseEther(price), ""],
                value: parseEther(deposit.toString())
            })
            const hash = await writeContract(config as Config, request)
            const receipt = await waitForTransactionReceipt(config as Config, { hash });

            if (!receipt) throw new Error("Couldn't Make Offer!")

            didSucceed = true
            setIsHandLoading(false)
            setSuccess(true)

            // revalidate moment data
            await revalidateMomentData(tokenId)
            // revalidate user's activity
            await revalidateUserActivity(address as `0x${string}`)

        } catch(error) {
            console.error("handleMakeOffer: ", error)
            setIsHandLoading(false)
            setError("Couldn't Make Offer!")
        } finally {
            setTimeout(() => {
                setError("")
                setSuccess(false)
                if(didSucceed) {
                    setIsModalOpen(false)
                    route.refresh()
                }
            }, 5000)
        }
    }

    const handleListing = async () => {
        setIsHandLoading(true)
        
        let didSucceed = false
        // call contract function
        try{
            const { request } = await simulateContract(config as Config, {
                abi: MARKETPLACE_CONTRACT_ABI,
                address: MARKETPLACE_CONTRACT_ADDRESS,
                functionName: 'createListing',
                args: [user?.username, BigInt(tokenId), BigInt(amount), parseEther(price), BigInt(604800)]
            })
            const hash = await writeContract(config as Config, request)
            const receipt = await waitForTransactionReceipt(config as Config, { hash });

            if (!receipt) throw new Error("Couldn't Create Listing!")

            didSucceed = true
            setIsHandLoading(false)
            setSuccess(true)

            // revalidate moment data
            await revalidateMomentData(tokenId)
            // revalidate marketplace data
            await revalidateMarketplace()
            // revalidate user activity
            await revalidateUserActivity(address as `0x${string}`)

        } catch(error) {
            console.error("handleListing: ", error)
            setIsHandLoading(false)
            setError("Couldn't Create Listing!")
        } finally {
            setTimeout(() => {
                setError("")
                setSuccess(false)
                if(didSucceed) {
                    setIsModalOpen(false)
                    route.refresh()
                }
            }, 5000)
        }
    }

    const handleAcceptOffer = async(offerId: number) => {
        setIsHandLoading(true)

        let didSucceed = false
        try{
            // call contract function
            const { request } = await simulateContract(config as Config, {
                abi: MARKETPLACE_CONTRACT_ABI,
                address: MARKETPLACE_CONTRACT_ADDRESS,
                functionName: 'acceptBuyOffer',
                args: [BigInt(offerId), user?.username]
            })
            const hash = await writeContract(config as Config, request)
            const receipt = await waitForTransactionReceipt(config as Config, { hash });

            if (!receipt) throw new Error("Couldn't Accept Offer!")

            didSucceed = true
            setIsHandLoading(false)
            setSuccess(true)

            // revalidate moment data
            await revalidateMomentData(tokenId)
            // revalidate marketplace data
            await revalidateMarketplace()
            // revalidate user's nfts
            await revalidateUsersNfts(address as `0x${string}`)

        } catch(error) {
            console.error("handleAcceptOffer: ", error)
            setIsHandLoading(false)
            setError("Couldn't Accept Offer!")
        } finally {
            setTimeout(() => {
                setError("")
                setSuccess(false)
                if(didSucceed) {
                    setIsModalOpen(false)
                    route.refresh()
                }
            }, 5000)
        }
    }

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
    }, [price]);

    // Toggle button styles
    const toggleTheme = 'dark:bg-teal-800 bg-teal-600 text-white rounded-full'

  return (
    <div className="my-16">
        {/* NFT */}
        <div className="border-b border-gray-500/30 mb-4">
            {/* Image */}
            <div 
                className="flex items-center justify-center relative overflow-hidden"
                style={{ maxHeight: '65vh' }}
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
                    className="flex items-center gap-2"
                    onClick={() => route.push(`/user/${moment?.creator_fid}/${moment?.creator}`)}
                >
                    <img 
                        src={moment?.pfpUrl} 
                        alt={moment?.creator}
                        className="w-6 h-6 object-cover rounded-full"
                    />
                    <span className="text-lg font-semibold">{moment?.creator}</span>
                </div>
                <div className="flex items-center justify-even gap-2">
                    <Heart size={25} className="text-red-500"/>
                    <span className="text-lg font-semibold">{moment?.totalMints}</span>
                </div>
            </div>
            <div className="px-4 pb-4 space-y-2 text-gray-700 dark:text-gray-300">
                <p className="text-sm font-semibold">{moment?.created}</p>
                <p className="text-lg">{moment?.desc}</p>
                <p className="text-md font-semibold">Mint Price: {moment?.price} ETH</p>
            </div>
        </div>

        {/* Pricing and Stats */}
        <div className="border-b border-gray-500/30 px-4 py-6">
            <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                    <p className="text-md text-gray-700 dark:text-gray-300 mb-1">Top Offer</p>
                    <p className="text-xl font-semibold text-[#383B3E] dark:text-gray-400">{momentSale?.highestOffer} ETH</p>
                </div>
                <div className="text-center">
                    <p className="text-md text-gray-700 dark:text-gray-300 mb-1">Collection Floor</p>
                    <p className="text-xl font-semibold text-[#383B3E] dark:text-gray-400">{momentSale?.collectionFloor} ETH</p>
                </div>
                {/* <div className="text-center">
                    <p className="text-md text-gray-700 dark:text-gray-300 mb-1">Volume</p>
                    <p className="text-xl font-semibold text-[#383B3E] dark:text-gray-400">{activity?.volume} ETH</p>
                </div> */}
                <div className="text-center">
                    <p className="text-md text-gray-700 dark:text-gray-300 mb-1">Last Sale</p>
                    <p className="text-xl font-semibold text-[#383B3E] dark:text-gray-400">{momentSale?.lastSale} ETH</p>
                </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="border-b border-gray-500/30 px-4 py-6 space-y-3">
            {
                (momentSale?.listings.length ?? 0) > 0 && (
                    <>
                        <div className="text-center p-2 mb-4 text-gray-700 dark:text-gray-300">
                            <p className="text-lg font-medium">Buy For {momentSale?.buyNow.price} ETH</p>
                            <p className="text-md text-muted-foreground">ending in {momentSale?.buyNow.expires}</p>
                        </div>

                        <button 
                            onClick={ async() => {
                                if(isConnected)
                                    await handleBuyNow()
                            }} 
                            disabled={isHandLoading || (ethBalance < Number(momentSale?.buyNow.price))} 
                            className={`w-full text-lg ${(error) ? 'bg-red-500' : 'bg-blue-500'} ${(success) && 'bg-green-700'} text-white text-center px-3 py-2 rounded-full`}
                        >
                            {
                                (ethBalance < Number(momentSale?.buyNow.price)) ? `Insufficient Balance (${ethBalance.toFixed(2)} ETH)` : <>
                                    {
                                        isHandLoading 
                                        ? <span className="flex items-center justify-center">
                                                <LoaderCircle size={30} className="animate-spin text-white" />
                                            </span>
                                        : <>
                                            {
                                                error 
                                                ? `${error} Try Again!` 
                                                : <>
                                                    {success ? `Bought Successfully` : "Buy Now"}
                                                </>
                                            }
                                        </>
                                    }
                                </>
                            }
                        </button>
                    </>
                )
            }

            {/* Toggle */}
            <div className={`grid place-items-center my-5`}>
                <div className="font-semibold text-[#383B3E] dark:text-gray-400 flex space-x-1 p-1 border dark:border-teal-500 border-teal-600 rounded-full">
                    <span 
                        className={`py-2 px-3 text-md hover:cursor-pointer ${offering && toggleTheme}`}
                        onClick={() => {
                            setOffering(true)
                            setListing(false)
                            setAccOffer(false)
                            setIsModalOpen(true)
                        }}
                    >
                        Make Offer
                    </span>
                    {
                        balance > 0 && (
                            <>
                                <span 
                                    className={`py-2 px-3 text-md hover:cursor-pointer ${listing && toggleTheme}`}
                                    onClick={() => {
                                        setOffering(false)
                                        setListing(true)
                                        setAccOffer(false)
                                        setIsModalOpen(true)
                                    }}
                                >
                                    Create Listing
                                </span>
                                {
                                    (momentSale?.orders.length ?? 0) > 0 && (
                                        <span 
                                            className={`py-2 px-3 text-md hover:cursor-pointer ${accOffer && toggleTheme}`}
                                            onClick={() => {
                                                setOffering(false)
                                                setListing(false)
                                                setAccOffer(true)
                                                setIsModalOpen(true)
                                            }}
                                        >
                                            Offers Made
                                        </span>
                                    )
                                }
                            </>
                        )
                    }
                </div>
            </div>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => {
                    setIsModalOpen(false)
                    setSuccess(false)
                    setPrice("")
                    setAmount("")
                    setSelectedId(null)
                }}
            >
                <h2 className="text-3xl font-semibold dark:text-gray-400 text-gray-800 mb-4">
                    {listing && "Create Listing"} {offering && "Make Offer"}
                </h2>
                {
                    (listing || offering) && (
                        <div>
                            {/* NFT Amount */}
                            <div>
                                <p className="text-lg font-semibold my-2 dark:text-gray-400 text-gray-800">
                                    Amount
                                    {
                                        listing && (
                                            <span className="text-sm ml-3">{`*Your Max Supply Is ${balance}`}</span>
                                        )
                                    }
                                </p>
                                <label className={`flex items-center justify-between gap-2 cursor-pointer p-2 border ${emptyAmount ? "border-red-500 dark:border-red-800 dark:bg-red-500/10 bg-red-100/10" : "dark:bg-[#222529] bg-teal-500/10 border-teal-700"} rounded-lg text-lg`}>
                                <input
                                    placeholder="10"
                                    type="text"
                                    value={amount}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/^\d*$/.test(val)) {
                                            if (Number(val) > balance && listing) 
                                                setAmount(balance.toString())
                                            else
                                                setAmount(val)
                                        };
                                        setEmptyAmount(false)
                                    }}
                                    className="px-4 py-3 w-full outline-none font-semibold text-gray-700 dark:text-gray-300"
                                />
                                </label>
                            </div>
                            {/* Price Per Amount */}
                            <div className={`space-y-3`}>
                                <p className="text-lg font-semibold my-2 dark:text-gray-400 text-gray-700">
                                    Price / NFT <span className="text-sm ml-3">*Minimum is 0.001 ETH</span>
                                </p>
                                <label className={`flex items-center justify-between gap-2 cursor-pointer p-2 border ${emptyPrice ? "border-red-500 dark:border-red-800 dark:bg-red-500/10 bg-red-100/10" : "dark:bg-[#222529] bg-teal-500/10 border-teal-700"} rounded-lg text-lg`}>
                                    <input
                                        placeholder="0.01 ETH"
                                        type="text"
                                        value={price}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (/^\d*\.?\d*$/.test(val)) setPrice(val);
                                            setEmptyPrice(false)
                                        }}
                                        onBlur={() => {
                                            if (Number(price) < 0.001) setPrice("0.001");
                                        }}
                                        className="px-4 py-3 w-full outline-none font-semibold text-gray-700 dark:text-gray-300"
                                    />
                                    <p className={`text-lg pr-2 dark:text-gray-400 text-gray-700 font-semibold`}>${(Number(inUsd) * Number(price)).toFixed(2)}</p>
                                </label>
                                {
                                    (price && amount) && (Number(price) >= 0.001) && (
                                        <div>
                                            {
                                                listing ? (
                                                    <p className="text-center py-2 text-lg">
                                                        You'll recieve a total of <span className="font-semibold text-teal-500">{Number(price) * Number(amount)} ETH</span> if entire amount is bought.
                                                    </p>
                                                ) : (
                                                    <p className="text-center py-2 text-lg">
                                                        You'll deposit a total of <span className="font-semibold text-teal-500">{Number(price) * Number(amount)} ETH</span>.
                                                    </p>
                                                )
                                            }
                                        </div>
                                    )
                                }
                                {
                                    error && (
                                        <div className="text-center text-red-200 rounded-lg bg-red-500 flex flex-col py-2 font-semibold text-lg">
                                            <span className="">{error}</span>
                                        </div>
                                    )
                                }
                                {
                                    success && (
                                        <div className="text-center text-green-100 rounded-lg bg-green-600 flex items-center justify-center space-x-2 py-2 text-lg font-semibold ">
                                            <CircleCheck size={30} className="" />
                                            <span className="">
                                                {
                                                    listing ? "Listing Created" : "Offer Made"
                                                }
                                            </span>
                                        </div>
                                    )
                                }
                                <button
                                    onClick={async() => {
                                        if(!isConnected) return
                                        if(!amount) setEmptyAmount(true)
                                        if(!price) setEmptyPrice(true)
                                        if(price && amount) {
                                            if(listing) 
                                                await handleListing()
                                            else
                                                await handleMakeOffer()
                                        }
                                    }}
                                    disabled={isHandLoading || ((ethBalance < (Number(price) * Number(amount))) && offering) || success}
                                    className={`w-full text-blue-500 dark:text-blue-200 text-xl my-5 px-4 py-3 bg-gradient-to-br from-blue-500/15 to-teal-500/15 dark:from-blue-500/35 dark:to-teal-500/35 rounded-full font-medium flex items-center justify-center border border-teal-500 dark:border-teal-800 ${(success || error) && "hidden"}`}
                                >
                                    {
                                        isHandLoading 
                                        ? (
                                            <>
                                                {
                                                    (offering || listing) && <span className="flex items-center justify-center text-blue-500 dark:text-blue-200">
                                                        <LoaderCircle size={30} className="animate-spin text-white" />
                                                    </span>
                                                }
                                            </>
                                        ) 
                                        : (
                                            <>
                                                {
                                                    offering && (
                                                        <>
                                                            {
                                                                (ethBalance < (Number(price) * Number(amount)))  ? `Insufficient Balance (${ethBalance.toFixed(2)} ETH)` : "Make Offer"
                                                            }
                                                        </>
                                                    )
                                                }
                                                {listing && "List"}
                                            </>
                                        ) 
                                    }
                                </button>
                            </div>
                        </div>
                    )
                }
                {
                    accOffer && (
                        <div>
                            <div className="text-center py-5 text-lg">
                                <p>You have <span className="font-semibold text-teal-500">{balance}</span> of this NFT</p>
                                <p>Only 1 NFT will be transferred when an offer is accepted</p>
                            </div>
                            {
                                momentSale?.orders.map((offer) => {
                                    return (
                                        <div
                                            key={offer.id}
                                        >
                                            {
                                                selectedId === offer.id && (
                                                    <div className="p-5">
                                                    {
                                                        isHandLoading && (
                                                        <div className="text-center text-blue-200 rounded-lg bg-blue-500 flex flex-col gap-1 py-2 font-semibold text-lg">
                                                            <span className="text-lg text-white">Accepting Offer ...</span>
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
                                                            <span className="">Offer Accepted</span>
                                                        </div>
                                                        )
                                                    }
                                                    </div>
                                                )
                                            }
                                            <button
                                                onClick={async() => {
                                                    if(!isConnected) return
                                                    setSelectedId(offer.id)
                                                    await handleAcceptOffer(offer.id) 
                                                }}
                                                disabled={success || selectedId !== null}
                                                className={`${selectedId === offer.id ? "hidden" : "w-full text-blue-500 dark:text-blue-200 text-xl my-3 px-4 py-3 bg-gradient-to-br from-blue-500/15 to-teal-500/15 dark:from-blue-500/35 dark:to-teal-500/35 rounded-full font-medium flex items-center justify-center border border-teal-500 dark:border-teal-800"}`}
                                            >
                                                Accept for {offer.price} ETH
                                            </button>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    )
                }
            </Modal>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6">
            <div className="flex items-center text-gray-700 dark:text-gray-300 justify-center border-b border-teal-500/20 px-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 text-lg font-semibold ${
                        activeTab === tab.id
                            ? "text-teal-700 border-b-2 border-teal-600 border-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="px-4 py-4">
                {activeTab === "orders" && <OrdersListingTable data={momentSale?.orders ?? []} tab="orders" />}
                {activeTab === "listing" && <OrdersListingTable data={momentSale?.listings ?? []} tab="listing"/>}
                {/* {activeTab === "activity" && <ActivityTable />} */}
            </div>
        </div>
    </div>
  )
}
