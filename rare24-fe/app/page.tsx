import HomeClient from "./client";
import { getSharedMoments } from "./blockchain/getterHooks";
// import type { Metadata } from "next";

export default async function HomePage() {
  try {
    const moments = await getSharedMoments()

    // console.log('Fetched Listings:', moments)

    return <HomeClient sharedMoments={moments} />
  } catch (error) {
    console.error('Error fetching Listings:', error)
    return (
      <HomeClient sharedMoments={[]} />
    )
  }
}

// export async function generateMetadata(): Promise<Metadata> {
//   return {
//     title: "Rare24",
//     description: "Mint exclusive photo NFTs from your favourite creators daily. Only one moment drops every 24 hours, collect, trade, and own rare memories",
//     other: {
//       "fc:miniapp": JSON.stringify({
//         version: "1",
//         imageUrl: "https://rare24.xyz/hero.png",
//         button: {
//           title: "Drop today's moment",
//           action: {
//             name: `Launch Rare24`,
//             url: "https://rare24.xyz"
//           },
//         },
//       }),
//     },
//   };
// }