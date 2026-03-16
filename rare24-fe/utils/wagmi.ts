import { http, createConfig } from 'wagmi'
import { polkadotHubTestnet } from './chains'
import { injected } from 'wagmi/connectors'
// import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'

// const isFarcaster = typeof window !== 'undefined' &&
//   // @ts-ignore
//   (window.fc !== undefined || window.farcaster !== undefined);

// const getConnectors = () => {
//   if (isFarcaster) {
//     return [miniAppConnector()];
//   }
//   // For Base App
//   return injected()
// };

export const config = createConfig({
  chains: [polkadotHubTestnet],
  transports: {
    [polkadotHubTestnet.id]: http(process.env.PASEO_RPC ?? polkadotHubTestnet.rpcUrls.default.http[0]),
  },
  connectors: [injected({ target: 'metaMask', shimDisconnect: true })]
})

