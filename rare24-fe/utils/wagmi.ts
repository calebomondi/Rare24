import { http, createConfig } from 'wagmi'
import { polkadotHubTestnet } from './chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [polkadotHubTestnet],
  transports: {
    [polkadotHubTestnet.id]: http(process.env.PASEO_RPC ?? polkadotHubTestnet.rpcUrls.default.http[0]),
  },
  connectors: [injected({ shimDisconnect: true })]
})

