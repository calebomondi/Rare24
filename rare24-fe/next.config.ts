import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  /* Redirects */
  // async redirects() {
  //   return [
  //     {
  //       source: '/.well-known/farcaster.json',
  //       destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/019b47d5-5a0f-21b9-afc8-478832a6bc85',
  //       permanent: false,
  //     },
  //   ]
  // },
};

export default nextConfig;
