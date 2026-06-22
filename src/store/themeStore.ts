import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Theme {
  key: string
  name: string
  pageBg: string
  sidebarBg: string
  cardBg: string
  drawerBg: string
  inputBg: string
  accent: string
  accentDark: string
  accentRgb: string
}

export const THEMES: Theme[] = [
  {
    key: 'purple',
    name: 'Dark Purple',
    pageBg: '#131326',
    sidebarBg: '#0d0f23',
    cardBg: '#13152e',
    drawerBg: '#1a1b3a',
    inputBg: '#1e2248',
    accent: '#7c6bff',
    accentDark: '#6456e8',
    accentRgb: '124,107,255',
  },
  {
    key: 'navy',
    name: 'Dark Navy',
    pageBg: '#0d1117',
    sidebarBg: '#080d14',
    cardBg: '#0f1520',
    drawerBg: '#141c2b',
    inputBg: '#192336',
    accent: '#3b82f6',
    accentDark: '#2563eb',
    accentRgb: '59,130,246',
  },
  {
    key: 'emerald',
    name: 'Dark Emerald',
    pageBg: '#0c1a15',
    sidebarBg: '#071210',
    cardBg: '#0f1f19',
    drawerBg: '#132620',
    inputBg: '#182e25',
    accent: '#10b981',
    accentDark: '#059669',
    accentRgb: '16,185,129',
  },
  {
    key: 'slate',
    name: 'Dark Slate',
    pageBg: '#0f1117',
    sidebarBg: '#09090f',
    cardBg: '#13141c',
    drawerBg: '#191a26',
    inputBg: '#1e1f2e',
    accent: '#8b5cf6',
    accentDark: '#7c3aed',
    accentRgb: '139,92,246',
  },
  {
    key: 'rose',
    name: 'Dark Rose',
    pageBg: '#160d12',
    sidebarBg: '#0f080d',
    cardBg: '#1c1018',
    drawerBg: '#22141e',
    inputBg: '#271824',
    accent: '#f43f5e',
    accentDark: '#e11d48',
    accentRgb: '244,63,94',
  },
]

interface ThemeState {
  themeKey: string
  setTheme: (key: string) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeKey: 'purple',
      setTheme: (key) => set({ themeKey: key }),
    }),
    { name: 'church-theme' }
  )
)

export function getTheme(key: string): Theme {
  return THEMES.find(t => t.key === key) ?? THEMES[0]
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.style.setProperty('--page-bg', theme.pageBg)
  root.style.setProperty('--sidebar-bg', theme.sidebarBg)
  root.style.setProperty('--card-bg', theme.cardBg)
  root.style.setProperty('--drawer-bg', theme.drawerBg)
  root.style.setProperty('--input-bg', theme.inputBg)
  root.style.setProperty('--accent', theme.accent)
  root.style.setProperty('--accent-dark', theme.accentDark)
  root.style.setProperty('--accent-rgb', theme.accentRgb)
}
