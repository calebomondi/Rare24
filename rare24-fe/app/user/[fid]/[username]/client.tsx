"use client"

import { useState, useEffect } from "react";
import { CreatorNftData, UserData} from "@/app/types/index.t";
import { useRouter } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { useConnection } from "wagmi";

interface Props {
    parsedMoments: CreatorNftData,
    user: UserData | null
}

function formatNumberWithCommas(num: number | string): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function UserClient({ parsedMoments, user } : Props) {
  const route = useRouter()
  const [moments, setMoments] = useState<CreatorNftData | null>(null)
  const { address } = useConnection()

  // set initialActivity
  useEffect(() => {
    setMoments(parsedMoments)
  }, [])

  return (
    <main className="mt-20 mb-16">
      <div className="w-full max-w-md">
        {/* User Profile Card */}
        <div className="bg-card px-4">
          {/* Header Section */}
          <div className="flex items-center gap-4 p-4">
            <div className="w-24 h-24 rounded-full border-2 border-teal-50 flex-shrink-0">
              <img 
                src={user?.pfpUrl} 
                alt={user?.displayName} 
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="">
              <h2 className="font-semibold text-lg text-foreground">{user?.displayName}</h2>
              <h3 className="text-md text-foreground">@{user?.username}</h3>
            </div>
          </div>

          <p className="text-md px-4 text-muted-foreground">{user?.bio}</p>

          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-6 px-4 mt-4">
            <div className="">
              <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200">{moments?.Nfts.length ?? 0}</p>
              <p className="text-lg text-gray-700 dark:text-gray-400">Moments</p>
            </div>
            <div className="">
              <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200">{formatNumberWithCommas(moments?.mints ?? 0)}</p>
              <p className="text-lg text-gray-700 dark:text-gray-400">Total Mints</p>
            </div>
            <div className="">
              <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200">{formatNumberWithCommas(user?.followerCount ?? 0)}</p>
              <p className="text-lg text-gray-700 dark:text-gray-400">Follows</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-border border-gray-600 mt-3" />

        {/* Moments and Holding Card */}
        <div className="bg-card p-4">
            {/* Tabs */}
            <div className="flex items-center justify-center gap-8 mb-6 border-b border-teal-500/20">
                <LayoutGrid  
                  size={30}
                  className="text-teal-700 mb-2"
                />
            </div>

            {/* Grid of Items */}
            <div className="grid grid-cols-2 gap-1">
                {
                    moments?.Nfts.map((item) => (
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
        </div>
      </div>
    </main>
  );
}
