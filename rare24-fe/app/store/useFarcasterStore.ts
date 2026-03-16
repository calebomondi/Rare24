// store/useFarcasterStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserData, Notification } from '../types/index.t'

interface FarFarcasterStore {
  user: UserData | null
  loading: boolean
  hydrated: boolean
  setUser: (user: UserData) => void
  setLoading: (loading: boolean) => void
  setHydrated: (hydrated: boolean) => void
  clearUser: () => void
}

interface NotificationsStore {
  notify: Notification[] | null
  loading: boolean
  hydrated: boolean
  setNotify: (notify: Notification[]) => void
  setLoading: (loading: boolean) => void
  setHydrated: (hydrated: boolean) => void
  clearUser: () => void
}

export const useFarcasterStore = create<FarFarcasterStore>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      hydrated: false,
      setUser: (user) => set({ user, loading: false }),
      setLoading: (loading) => set({ loading }),
      setHydrated: (hydrated) => set({ hydrated }),
      clearUser: () => set({ user: null })
    }),
    {
      name: 'farcaster-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)

export const useNotificationStore = create<NotificationsStore>()(
  persist(
    (set) => ({
      notify: null,
      loading: true,
      hydrated: false,
      setNotify: (notify) => set({ notify, loading: false }),
      setLoading: (loading) => set({ loading }),
      setHydrated: (hydrated) => set({ hydrated }),
      clearUser: () => set({ notify: null })
    }),
    {
      name: 'notify-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
