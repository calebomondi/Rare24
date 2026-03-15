// store/useFarcasterStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserData, Notification } from '../types/index.t'

interface FarcasterStore {
  user: UserData | null
  loading: boolean
  setUser: (user: UserData) => void
  setLoading: (loading: boolean) => void
  clearUser: () => void
}

interface NotificationsStore {
  notify: Notification[] | null
  loading: boolean
  setNotify: (notify: Notification[]) => void
  setLoading: (loading: boolean) => void
  clearUser: () => void
}

export const useFarcasterStore = create<FarcasterStore>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      setUser: (user) => set({ user, loading: false }),
      setLoading: (loading) => set({ loading }),
      clearUser: () => set({ user: null })
    }),
    {
      name: 'farcaster-storage', // key
    }
  )
)

export const useNotificationStore = create<NotificationsStore>()(
  persist(
    (set) => ({
      notify: null,
      loading: true,
      setNotify: (notify) => set({ notify, loading: false }),
      setLoading: (loading) => set({ loading }),
      clearUser: () => set({ notify: null })
    }),
    {
      name: 'notify-storage', // key
    }
  )
)