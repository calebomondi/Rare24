"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Bell, Wallet, RefreshCcwDot, Info } from "lucide-react"
import { useConnection, useConnectors, useConnect, useSwitchChain } from 'wagmi'
import { usePathname } from "next/navigation"
import { useNotificationStore } from "../store/useFarcasterStore"
import { checkNotification } from "../blockchain/getterHooks"
import { polkadotHubTestnet } from "@/utils/chains"
import ThemeToggle from "./theme-toggle"

export default function TopBar() {
  const { switchChain, isError } = useSwitchChain()
  const { isConnected, address, chain } = useConnection()
  const connectors = useConnectors()
  const { connect } = useConnect()
  const pathname = usePathname()

  const { setNotify, setLoading, notify, loading } = useNotificationStore()
  const [mounted, setMounted] = useState(false)


  useEffect(() => {
    setMounted(true)
  }, [])

  // Switch network if needed
  useEffect(() => {
    // Only switch if connected and not on polkadotHubTestnet
    if (isConnected && chain?.id !== polkadotHubTestnet.id) {
      switchChain({ chainId: polkadotHubTestnet.id })
    }
  }, [isConnected, chain?.id, switchChain])

  // Check Notifications
  useEffect(() => {
    if (!address) return
    try {
      const fetchData = async() => {
        setLoading(true)

        const data = await checkNotification(address as `0x${string}`)
        if(data)
          setNotify(data)
      }
      fetchData()
    } catch(error) {
      console.error('Error loading Notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [address, setNotify, setLoading])

  return (
    <header className="fixed top-0 left-0 right-0 border-b-1 dark:border-gray-600 border-border bg-background z-50">
      <div className="flex items-center justify-between h-16 px-4 max-w-md mx-auto sm:max-w-none sm:px-6">
        {/* Info */}
        <div className="flex items-center">
          <Link
            href="/info"
            className={`relative flex items-center justify-center w-10 h-10 rounded-full ${pathname === "/info" && "bg-[#00B7B5]/50 text-[#005461] dark:text-[#F4F4F4]/80"} hover:bg-muted transition-colors`}
            aria-label="Info"
          >
            <Info className={``} size={30} />
          </Link>
          <ThemeToggle />
        </div>
        
        {/* Logo/Brand */}
        <div className="flex items-center">
          <img 
              src="/rare24.png" 
              alt="Rare24 Logo"
              className="w-18 object-cover"
          />
        </div>

        {/* Notification Bell & Well*/}
        <div className={`flex items-center justify-between gap-1`}>
          <Link
            href="/notifications"
            className={`relative flex items-center justify-center w-10 h-10 rounded-full ${pathname === "/notifications" && "bg-[#00B7B5]/50"} hover:bg-muted transition-colors`}
            aria-label="Notifications"
          >
            <Bell className={`${pathname === "/notifications" && "text-[#005461] dark:text-[#F4F4F4]/80"}`} size={30} />
            {
              (notify?.length ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                  {(notify?.length ?? 0) > 9 ? '9+' : notify?.length}
                </span>
              )
            }
          </Link>
          <div className="cursor-pointer">
            {
              !isConnected && mounted && (
                <button 
                  onClick={() => {
                      connect({ connector: connectors[0], chainId: polkadotHubTestnet.id })
                      console.log(`Address: ${address}`)
                    }
                  }
                  disabled={isConnected}
                  className={``}
                >
                  <Wallet className={``} size={30} />
                </button>
              ) 
            }
            {
              isError && isConnected && (
                <button 
                  onClick={() => {
                    switchChain({ chainId: polkadotHubTestnet.id })
                  }}
                  disabled={isConnected}
                  className={``}
                >
                  <RefreshCcwDot className={``} size={30} />
                </button>
              ) 
            }
          </div>
        </div>
      </div>
    </header>
  )
}
