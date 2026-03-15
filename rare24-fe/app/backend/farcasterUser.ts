"use server"

// import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

// const client = new NeynarAPIClient(
//   new Configuration({ apiKey: process.env.NEYNAR_API_KEY ?? '' })
// );

export async function getFarcasterUser(fid: number) {
  const response = await fetch(
    `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NEYNAR_API_KEY!
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    }
  );
  
  const data = await response.json();
  const user = data.users[0];
  
  return {
    fid: user.fid as number,
    username: user.username as string,
    displayName: user.display_name as string,
    pfpUrl: user.pfp_url as string,
    followerCount: user.follower_count as number,
    followingCount: user.following_count as number,
    bio: user.profile.bio.text as string
  };
}

// export async function getAllFollowings(fid: number) {
//   const allFollowing: any[] = [];
//   let cursor: string | null = null;

//   do {
//     const url = cursor 
//       ? `https://api.neynar.com/v2/farcaster/following/?limit=100&fid=${fid}&cursor=${cursor}`
//       : `https://api.neynar.com/v2/farcaster/following/?limit=100&fid=${fid}`;

//     const response = await fetch(url, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//       }
//     });

//     if (!response.ok) {
//       throw new Error(`API request failed: ${response.status}`);
//     }

//     const data: any = await response.json();
    
//     // Check if users array exists and is an array
//     if (data.users && Array.isArray(data.users)) {
//       allFollowing.push(...data.users);
//     } else {
//       console.error('Unexpected API response structure:', data);
//       break;
//     }
    
//     cursor = data.next?.cursor || null;

//   } while (cursor);

//   return allFollowing.map(account => account.username as string);
// }

// export async function searchUsers(query: string) {
//   try {
//     const res = await client.searchUser({
//       q: query,
//       limit: 100,
//     });
    
//     return res
//   } catch (err) {
//     console.error(`Error searching users: ${err}`);
//   }
// }