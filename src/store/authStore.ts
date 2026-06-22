import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/api/auth'

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  setUser: (user: AuthUser | null) => void
  logout: () => void
  setHasHydrated: (v: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'church-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
