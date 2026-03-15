import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create a SQL client
export const sql = neon(process.env.DATABASE_URL);

// Types
export interface FarcasterUser {
  id: number;
  fid: number;
  username: string;
  display_name: string | null;
  pfp_url: string | null;
  bio: string | null;
  created_at: Date;
  updated_at: Date;
}