import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:; connect-src 'self' https: data: blob:; img-src 'self' data: https: blob:; font-src 'self' data:;"
          }
        ]
      }
    ]
  },
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
