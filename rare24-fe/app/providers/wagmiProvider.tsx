'use client'

import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '@/utils/wagmi'
import { ReactNode } from 'react'
import sdk from '@farcaster/miniapp-sdk'

const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: ReactNode }) {
  // Initialize Farcaster SDK on client side
  useEffect(() => {
    const init = async () => {
      await sdk.actions.ready()
    }
    init()
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}