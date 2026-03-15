"use client"

import { useRouter } from "next/navigation"
import { useNotificationStore } from "../store/useFarcasterStore"

export default function Notifications() {
  const route = useRouter()
  const { notify } = useNotificationStore()

  return (
    <div className={`my-16`}>
      {
        (notify?.length ?? 0) > 0 ? (
          <>
            {
              notify?.map(notification => {
                return (
                  <div className="border-b-1 border-gray-500/30" key={notification.imageUrl}>
                    {/* Image */}
                    <div 
                      className="p-2 flex items-center justify-evenly"
                      onClick={() => {
                        route.push(`nft/${notification.tokenId}`)
                      }}
                    >
                      <div className="relative aspect-square w-20 grid place-items-center shrink-0 overflow-hidden rounded-md">
                        <img 
                          src={notification?.imageUrl || "/placeholder.svg"} 
                          alt={notification.buyer} 
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="p-2 text-lg text-gray-700 dark:text-gray-300">
                          Offer for token
                          <span className="font-semibold"> #{notification.tokenId} </span>
                           from
                          <span className="font-semibold"> {notification.buyer} </span>
                          @
                          <span className="font-semibold"> {notification.price} ETH</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            }
          </>
        ) : (
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 8rem)' }}>
            <div className="flex flex-col items-center justify-center">
              <div className="relative aspect-square w-30 grid place-items-center shrink-0 overflow-hidden rounded-md">
                <img 
                  src={"/empty-box.png"} 
                  alt={"Empty Box"} 
                  className="object-cover"
                />
              </div>
              <span className="text-lg font-semibold text-teal-600/80">No Notifications!</span>
            </div>
          </div>
        )
      }
    </div>
  )
}
