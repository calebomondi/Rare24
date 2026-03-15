'use client'

import { useState, useEffect } from 'react';
import { searchUsers } from '../backend/neon';
import { FarcasterUser } from '@/utils/db';
import { CircleX, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SearchClient() {
  const router = useRouter()

  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<FarcasterUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchTerm.length === 0) {
      setUsers([]);
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);

      const result = await searchUsers(searchTerm, 10);
      if (result.success) {
        setUsers(result.users);
      }
      
      setLoading(false);
    };

    // Debounce the search
    const timeoutId = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <div className="w-full max-w-md mx-auto p-4 my-16">
      <div className='flex px-1 items-center justify-between gap-3'>
        <label className={`flex items-center w-full justify-between gap-2 cursor-pointer p-2 border dark:bg-[#222529] bg-teal-500/10 border-teal-700 rounded-full text-lg`}>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 w-full outline-none font-semibold text-gray-700 dark:text-gray-300"
          />
        </label>
        {
          searchTerm && (
            <CircleX 
              size={25} 
              className='text-gray-600 dark:text-gray-400' 
              onClick={() => setSearchTerm('')}
            />
          )
        }
      </div>
      
      {
        loading && <div className="flex items-center justify-center mt-3 p-2">
          <span className="animate-spin">
            <LoaderCircle size={35} className="text-teal-500/80"/>
          </span>
        </div>
      }
      
      <ul className="mt-4 space-y-2">
        {users.map((user: FarcasterUser) => (
          <li 
            key={user.fid} 
            className="p-3 border-b border-gray-500/30"
            onClick={() => router.push(`/user/${user.fid}/${user.username}`)}
          >
            <div className="flex items-center gap-3">
              <img 
                src={user?.pfp_url ?? ''} 
                alt={user.username}
                className="w-16 h-16 rounded-full"
              />
              <div>
                <p className="text-lg text-gray-700 dark:text-gray-300 font-semibold">{user.display_name}</p>
                <p className="text-md text-gray-600 dark:text-gray-400">@{user.username}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {
        !searchTerm && (
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 18rem)' }}>
            <div className="flex flex-col items-center justify-center">
              <div className="relative aspect-square w-30 grid place-items-center shrink-0 overflow-hidden rounded-md">
                <img src="/people.png" alt="Search People" className="object-cover" />
              </div>
            </div>
          </div>
        )
      }

      {!loading && searchTerm && users.length === 0 && (
        <p className="mt-4 text-center text-lg font-semibold text-teal-600/80">No users found</p>
      )}

    </div>
  );
}
