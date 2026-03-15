"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ImagePlus, Send, Replace, LoaderPinwheel, CircleCheck, CircleX } from "lucide-react"
import { uploadImage } from "../backend/upload"
import { getEthPrice } from "../backend/price"
import { useConnection, Config } from 'wagmi'
import { simulateContract, writeContract, waitForTransactionReceipt } from '@wagmi/core'
import { formatEther, parseEther } from "viem"
import { getCreatorMomentsCount, checkIfCanPost, revalidateCreatorMoments } from "../blockchain/getterHooks"
import { RARE24_CONTRACT_ABI, RARE24_CONTRACT_ADDRESS } from "../blockchain/core"
import { config } from "@/utils/wagmi"
import { useFarcasterStore } from "../store/useFarcasterStore"
import { CanPost } from "../types/index.t"
// import { saveUser } from "../backend/neon"
import imageCompression from 'browser-image-compression'
import { revalidateFeed } from "../blockchain/getterHooks"
import { saveUser } from "../backend/neon"

export function ImageUploadCard() {
  const route = useRouter()
  const { isConnected, address } = useConnection()
  const user = useFarcasterStore((state) => state.user)
  // const { data } = useBalance({ address })

  // console.log(`address: ${address} ${isConnected}`)

  const [caption, setCaption] = useState("")
  const [price, setPrice] = useState("");
  const [maxsupply, setMaxsupply] = useState("");
  const [inUsd, setInUsd] = useState("0")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [image, setImage] = useState<File | null>(null)
  const [emptyImage, setEmptyImage] = useState(false)
  const [emptyCaption, setEmptyCaption] = useState(false)
  const [emptyPrice, setEmptyPrice] = useState(false)
  const [emptySupply, setEmptySupply] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [momentCount, setMomentCount] = useState(0)
  const [maxSupplyLimit, setMaxSupplyLimit] = useState(0)
  const [canPost, setCanPost] = useState<CanPost | null>(null)

  // fetch user's ETH balance
  // const ethBalance = data ? Number(formatEther(data.value)) : 0

  // Image Size
  const MIN_WIDTH = 500
  const MAX_WIDTH = 5000
  const MIN_HEIGHT = 1080
  const MAX_HEIGHT = 5000

  useEffect(() => {
    // moment count
    const getCount = async() => {
      try {
        if(user){
          const count = await getCreatorMomentsCount(user?.username);
          setMomentCount(count)
          // console.log(user?.username, " + ", count)
        }
      } catch(error) {
        console.log('Error fetching user moment count:', error)
      }
    }
    getCount()

    // check if can post
    const post = async() => {
      try{
        if(user){
          const _canPost = await checkIfCanPost(user?.username)
          setCanPost(_canPost)
        }
      } catch(error) {
        console.log('Error checking if can post:', error)
      }
    }
    post()

    if(user) setMaxSupplyLimit(user.followerCount)
  }, []);

  // Image
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if(!file) return
    setEmptyImage(false) 

    // Reset error
    setError(null)

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file")
      return
    }

    // console.log(`originalFile size ${file.size / 1024 / 1024} MB`);

    // Create an image element to check dimensions
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      // Check dimensions
      if (img.width < MIN_WIDTH || img.width > MAX_WIDTH || img.height < MIN_HEIGHT || img.height > MAX_HEIGHT || img.width > img.height) {
        setError(`Invalid Image Dimensions!`)
        URL.revokeObjectURL(objectUrl)
        event.target.value = "" // Reset file input
        return
      }

      // If dimensions are correct, load the image
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setImage(file)
      }
      reader.readAsDataURL(file)
      URL.revokeObjectURL(objectUrl)
    }

    img.onerror = () => {
      setError("Failed to load image")
      URL.revokeObjectURL(objectUrl)
    }

    img.src = objectUrl
  }

  // ETH to USD
  useEffect(() => {
    const ethInUsd = async () => {
      const usdPrice = await getEthPrice()
      if(usdPrice) {
        const amountPrice = Number(price) * usdPrice;
        setInUsd(amountPrice.toFixed(2))
      } 
      // console.log(`eth price: ${usdPrice}`)
    }

    ethInUsd()
  }, [price]);

  // Close success
  const closeStatus = () => {
    setIsError(false)
    setIsSuccess(false)
    setSelectedImage(null)
    setCaption("")
    setPrice("")
    setMaxsupply("")
    setError(null)
  }

  // Upload
  const handleUpload = async () => {
    if (!selectedImage || !caption || !price || Number(price) == 0 || !maxsupply || Number(maxsupply) == 0) {
      if(!selectedImage) setEmptyImage(true);
      if(!caption) setEmptyCaption(true);
      if(!price || Number(price) == 0) setEmptyPrice(true);
      if(!maxsupply || Number(maxsupply) == 0) setEmptySupply(true);
      return
    }
    // console.log("Uploading:", { caption, price, maxsupply, momentCount })

    setIsUploading(true)

    try {
      // new Promise(resolve => setTimeout(resolve, 5000))

      const MAX_SIZE = 2 * 1024 * 1024 // 2MB
      const photo = image && image.size > MAX_SIZE
        ? await imageCompression(image, {
            maxWidthOrHeight: 1920,
            maxSizeMB: 1,
            initialQuality: 1,
            useWebWorker: true,
          })
        : image

      // Create FormData
      const formData = new FormData()
      photo && formData.append('image', photo)
      formData.append('caption', caption)
      user && formData.append('creator', user?.username)
      formData.append('momentCount', momentCount.toString())

      // Upload image to Pinata
      const response = await uploadImage(formData)
      if(!response.success) throw new Error("Image Upload Failed!");

      // Prepare contract arguments
      const creators: string[] = []
      const contractArgs = [
        response.message,
        parseEther(price),
        BigInt(maxsupply),
        user?.username,
        user?.pfpUrl,
        creators
      ] as const

      // Execute contract transaction AND save user in parallel
      const [receipt] = await Promise.all([
        // Contract operations
        (async () => {
          const { request } = await simulateContract(config as Config, {
            abi: RARE24_CONTRACT_ABI,
            address: RARE24_CONTRACT_ADDRESS,
            functionName: 'uploadNft',
            args: contractArgs
          })
          const hash = await writeContract(config as Config, request)
          return await waitForTransactionReceipt(config as Config, { hash })
        })(),
        
        // Save user to DB (independent operation)
        saveUser({
          fid: user?.fid,
          username: user?.username,
          display_name: user?.displayName,
          pfp_url: user?.pfpUrl,
          bio: user?.bio
        }).catch(err => console.error("Failed to save user:", err))
      ])

      if (!receipt) throw new Error("uploadNFT transaction failed!")

      // Revalidate pages
      await Promise.all([
        revalidateFeed(),
        address && revalidateCreatorMoments(address as `0x${string}`)
      ])
      
      // Update state
      setIsUploading(false)
      setIsSuccess(true)
    } catch (error) {
      console.error("Upload error:", error)
      setIsUploading(false)
      setIsError(true)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Main Content - fills available space */}
      <div className="flex-1 flex flex-col gap-4 p-4 overflow-auto">
        {/* Image Preview Area - grows to fill space */}
        <div className={`flex-1 flex flex-col items-center justify-center ${emptyImage && "border-2 border-dashed border-red-500 dark:border-red-800 dark:bg-red-500/10 bg-red-100/10 border-border rounded-lg"} ${(isUploading || isError || isSuccess) ? "" : "border-2 border-dashed  border-teal-500 dark:border-teal-800 dark:bg-[#222529] bg-teal-100/10 border-border rounded-lg"}`}>
          {selectedImage ? (
            <>
              <img
                src={selectedImage}
                alt="Selected"
                className={`w-full ${(isUploading || isError || isSuccess) ? "h-1/2" : "h-full"} object-contain rounded-lg`}
              />
              {
                isUploading && (
                  <div className="flex mt-5 flex-col w-full items-center text-teal-800 dark:text-teal-300 justify-center p-5 gap-2 border bg-teal-500/20 border-teal-700 rounded-lg">
                    <span className="animate-spin">
                      <LoaderPinwheel size={35} />
                    </span>
                    <span className="text-lg font-semibold">Turning Your Moment Into An NFT</span>
                  </div>
                )
              }
              {
                isError && (
                  <div className="flex mt-5 flex-col w-full items-center text-red-700 dark:text-red-300 justify-center p-5 gap-2 border bg-red-500/20 border-red-700 rounded-lg">
                    <span className="animate-pulse">
                      <CircleX size={35} />
                    </span>
                    <span className="text-lg font-semibold">Failed to Turn Moment Into NFT.</span>
                    <button onClick={() => closeStatus()} className="px-3 py-2 bg-red-600 rounded-lg text-white">
                      Let's Try Again
                    </button>
                  </div>
                )
              }
              {
                isSuccess && (
                  <div className="flex mt-5 flex-col w-full items-center text-green-800 dark:text-green-300 justify-center p-5 gap-2 border bg-green-500/20 border-green-700 rounded-lg">
                    <span className="animate-pulse">
                      <CircleCheck size={35} />
                    </span>
                    <span className="text-lg font-semibold">Successfully Shared Moment As NFT</span>
                    <button onClick={() => route.push("/")} className="px-3 py-2 bg-green-600 rounded-lg text-white">
                      Done
                    </button>
                  </div>
                )
              }
            </>
          ) : (
            <label className={`flex flex-col items-center gap-2 cursor-pointer p-8`}>
              <input 
                type="file" 
                accept="image/*" 
                disabled={!canPost?.canPost}
                onChange={handleImageSelect} 
                className="hidden" 
              />
              <ImagePlus size={48} className="" />
              <p className={`text-lg `}>Select an image to preview</p>
              <span className="text-sm text-primary underline mt-2">Click to browse</span>
            </label>
          )}
          {
            selectedImage && !isUploading && !isSuccess && !isError && (
              <span onClick={() => setSelectedImage(null)} className="dark:bg-gray-800 dark:border dark:border-gray-600 bg-gray-300 rounded-full p-2 my-2">
                <Replace size={25} className="" />
              </span>
            )
          }
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 text-center border border-red-500/50 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className={`${(isUploading || isError || isSuccess) && "hidden"} flex flex-col gap-4`}>
          {/* Caption Textarea */}
          <textarea
            placeholder="Add caption ..."
            disabled={!canPost?.canPost}
            value={caption}
            onChange={(e) => {
              setCaption(e.target.value)
              setEmptyCaption(false)
            }}
            className={`w-full px-4 py-3 border ${emptyCaption ? "border-red-500 dark:border-red-800 dark:bg-red-500/10 bg-red-100/10 focus:ring-red-500 " : "dark:bg-[#222529] bg-teal-500/10 border-teal-700 focus:ring-teal-500 "} rounded-lg text-lg focus:outline-none focus:ring-1 resize-none`}
            rows={4}
          />

          {/* Max Supply */}
          <div>
            <p className="text-sm my-2 dark:text-gray-400 text-gray-800">
              Total Supply <span className="text-xs">{`(Your Max Supply Is ${maxSupplyLimit})`}</span>
            </p>
            <label className={`flex items-center justify-between gap-2 cursor-pointer p-2 border ${emptySupply ? "border-red-500 dark:border-red-800 dark:bg-red-500/10 bg-red-100/10" : "dark:bg-[#222529] bg-teal-500/10 border-teal-700"} rounded-lg text-lg`}>
              <input
                placeholder="10"
                type="text"
                disabled={!canPost?.canPost}
                value={maxsupply}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val)) {
                    if (Number(val) > maxSupplyLimit) 
                      setMaxsupply(maxSupplyLimit.toString())
                    else
                      setMaxsupply(val)
                  };
                  setEmptySupply(false)
                }}
                className="px-4 py-3 w-full outline-none font-semibold text-gray-700 dark:text-gray-300"
              />
            </label>
          </div>

          {/* Price */}
          <div>
            <p className="text-sm my-2 dark:text-gray-400 text-gray-800">
              Price Per Token  <span className="text-xs">(Minimum is 0.001 ETH)</span>
            </p>
            <label className={`flex items-center justify-between gap-2 cursor-pointer p-2 border ${emptyPrice ? "border-red-500 dark:border-red-800 dark:bg-red-500/10 bg-red-100/10" : "dark:bg-[#222529] bg-teal-500/10 border-teal-700"} rounded-lg text-lg`}>
              <input
                placeholder="0.01 ETH"
                type="text"
                disabled={!canPost?.canPost}
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
              <p className={`text-lg pr-2 dark:text-gray-400 text-gray-800 font-semibold`}>${inUsd}</p>
            </label>
          </div>

          {/* Upload Button */}
          <button
            onClick={async() => await handleUpload()}
            disabled={!canPost?.canPost || !isConnected || isUploading}
            className="w-full px-4 py-3 bg-gradient-to-br from-blue-500/15 to-teal-500/15 dark:from-blue-500/35 dark:to-teal-500/35 rounded-full font-medium flex items-center justify-center border border-teal-500 dark:border-teal-800"
          >
            {
              !isConnected ? (
                <span className="text-blue-500 dark:text-blue-300">Connect Wallet</span>
              ) : (
                <>
                  {
                    canPost?.canPost ? (
                      <>
                        {/* {
                          ethBalance === 0 ? (
                            <span className="text-blue-500 dark:text-blue-300">Insufficient ETH Balance</span>
                          ) : (
                            <span className="text-blue-500 dark:text-blue-100">Share Moment</span>
                          )
                        } */}
                        <span className="text-blue-500 dark:text-blue-100">Share Moment</span>
                      </>
                    ) : (
                      <span className="text-blue-500 dark:text-blue-300">Moment Sharable In {canPost?.toNext}</span>
                    )
                  }
                </>
              )
            }
          </button>
        </div>
      </div>
    </div>
  )
}