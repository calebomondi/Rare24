import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { baseAccount } from 'wagmi/connectors'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'

const isFarcaster = typeof window !== 'undefined' &&
  // @ts-ignore
  (window.fc !== undefined || window.farcaster !== undefined);

const getConnectors = () => {
  if (isFarcaster) {
    return [miniAppConnector()];
  }
  // For Base App
  return [baseAccount({
    appName: 'Rare24',
    appLogoUrl: 'https://rare24.xyz/icon.png'
  })];
};

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(process.env.BASE_MAINNET_RPC),
  },
  connectors: getConnectors()
})

