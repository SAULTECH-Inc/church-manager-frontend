import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/api/auth'
import { setAuthToken } from '@/api/client'

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  setUser: (user: AuthUser | null, token?: string | null) => void
  logout: () => void
  setHasHydrated: (v: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setUser: (user, token = null) => {
        setAuthToken(token)
        set({ user, token, isAuthenticated: !!user })
      },
      logout: () => {
        setAuthToken(null)
        set({ user: null, token: null, isAuthenticated: false })
      },
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'church-auth',
      onRehydrateStorage: () => (state) => {
        if (state?.token) setAuthToken(state.token)
        state?.setHasHydrated(true)
      },
    }
  )
)
