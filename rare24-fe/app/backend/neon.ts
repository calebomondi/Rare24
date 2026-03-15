'use server'

import { sql, FarcasterUser } from '@/utils/db';

// Save or update a user when they share a photo
export async function saveUser(userData: {
  fid?: number;
  username?: string;
  display_name?: string;
  pfp_url?: string;
  bio?: string;
}) {
  try {
    const result = await sql`
      INSERT INTO farcaster_users (fid, username, display_name, pfp_url, bio)
      VALUES (
        ${userData.fid}, 
        ${userData.username}, 
        ${userData.display_name || null}, 
        ${userData.pfp_url || null},
        ${userData.bio || null}
      )
      ON CONFLICT (fid) 
      DO UPDATE SET
        username = EXCLUDED.username,
        display_name = EXCLUDED.display_name,
        pfp_url = EXCLUDED.pfp_url,
        bio = EXCLUDED.bio,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    console.log(`>>: ${result[0]}`)

    return true
  } catch (error) {
    console.error('Error saving user:', error);
    return false
  }
}

// Search users by username (case-insensitive, partial match)
export async function searchUsers(query: string, limit: number = 10) {
  try {
    if (!query || query.trim().length === 0) {
      return { success: true, users: [] };
    }

    // Use ILIKE for case-insensitive search with wildcards
    const users = await sql`
      SELECT * FROM farcaster_users
      WHERE username ILIKE ${'%' + query + '%'}
      ORDER BY username
      LIMIT ${limit}
    ` as FarcasterUser[];

    return { success: true, users };
  } catch (error) {
    console.error('Error searching users:', error);
    return { success: false, error: 'Failed to search users', users: [] };
  }
}

// Get user by exact username match
export async function getUserByUsername(username: string) {
  try {
    if (!username || username.trim().length === 0) {
      return { success: false, error: 'Username is required', fid: null };
    }

    // Use exact match with LOWER() for case-insensitive comparison
    const result = await sql`
      SELECT * FROM farcaster_users
      WHERE LOWER(username) = LOWER(${username.trim()})
      LIMIT 1
    ` as FarcasterUser[];

    if (result.length === 0) {
      return { success: false, error: 'User not found', fid: null };
    }

    return { success: true, fid: result[0].fid };
  } catch (error) {
    console.error('Error fetching user by username:', error);
    return { success: false, error: 'Failed to fetch user', fid: null };
  }
}

// // Get a specific user by FID
// export async function getUserByFid(fid: number) {
//   try {
//     const result = await sql<FarcasterUser[]>`
//       SELECT * FROM farcaster_users
//       WHERE fid = ${fid}
//       LIMIT 1
//     `;

//     return { success: true, user: result[0] || null };
//   } catch (error) {
//     console.error('Error getting user:', error);
//     return { success: false, error: 'Failed to get user', user: null };
//   }
// }

// // Get all users who have shared photos (optional - for listing)
// export async function getAllUsers(limit: number = 50, offset: number = 0) {
//   try {
//     const users = await sql<FarcasterUser[]>`
//       SELECT * FROM farcaster_users
//       ORDER BY updated_at DESC
//       LIMIT ${limit}
//       OFFSET ${offset}
//     `;

//     return { success: true, users };
//   } catch (error) {
//     console.error('Error getting users:', error);
//     return { success: false, error: 'Failed to get users', users: [] };
//   }
// }

// // Delete a user (if needed)
// export async function deleteUser(fid: number) {
//   try {
//     await sql`
//       DELETE FROM farcaster_users
//       WHERE fid = ${fid}
//     `;

//     return { success: true };
//   } catch (error) {
//     console.error('Error deleting user:', error);
//     return { success: false, error: 'Failed to delete user' };
//   }
// }