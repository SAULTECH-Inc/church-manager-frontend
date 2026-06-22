import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Theme {
  key: string
  name: string
  mode: 'dark' | 'light'
  pageBg: string
  sidebarBg: string
  cardBg: string
  drawerBg: string
  inputBg: string
  accent: string
  accentDark: string
  accentRgb: string
  inv: string       // '255 255 255' dark | '0 0 0' light — for rgb(var(--inv) / alpha) usage
  textPrimary: string
  glassBg: string   // semi-transparent card for auth pages
  inputFill: string // auth page input background
}

export const THEMES: Theme[] = [
  {
    key: 'purple',
    name: 'Dark Purple',
    mode: 'dark',
    pageBg: '#131326',
    sidebarBg: '#0d0f23',
    cardBg: '#13152e',
    drawerBg: '#1a1b3a',
    inputBg: '#1e2248',
    accent: '#7c6bff',
    accentDark: '#6456e8',
    accentRgb: '124,107,255',
    inv: '255 255 255',
    textPrimary: 'white',
    glassBg: 'rgba(19,21,46,0.55)',
    inputFill: 'rgba(19,21,46,0.6)',
  },
  {
    key: 'navy',
    name: 'Dark Navy',
    mode: 'dark',
    pageBg: '#0d1117',
    sidebarBg: '#080d14',
    cardBg: '#0f1520',
    drawerBg: '#141c2b',
    inputBg: '#192336',
    accent: '#3b82f6',
    accentDark: '#2563eb',
    accentRgb: '59,130,246',
    inv: '255 255 255',
    textPrimary: 'white',
    glassBg: 'rgba(8,13,20,0.55)',
    inputFill: 'rgba(8,13,20,0.6)',
  },
  {
    key: 'emerald',
    name: 'Dark Emerald',
    mode: 'dark',
    pageBg: '#0c1a15',
    sidebarBg: '#071210',
    cardBg: '#0f1f19',
    drawerBg: '#132620',
    inputBg: '#182e25',
    accent: '#10b981',
    accentDark: '#059669',
    accentRgb: '16,185,129',
    inv: '255 255 255',
    textPrimary: 'white',
    glassBg: 'rgba(7,18,16,0.55)',
    inputFill: 'rgba(7,18,16,0.6)',
  },
  {
    key: 'slate',
    name: 'Dark Slate',
    mode: 'dark',
    pageBg: '#0f1117',
    sidebarBg: '#09090f',
    cardBg: '#13141c',
    drawerBg: '#191a26',
    inputBg: '#1e1f2e',
    accent: '#8b5cf6',
    accentDark: '#7c3aed',
    accentRgb: '139,92,246',
    inv: '255 255 255',
    textPrimary: 'white',
    glassBg: 'rgba(9,9,15,0.55)',
    inputFill: 'rgba(9,9,15,0.6)',
  },
  {
    key: 'rose',
    name: 'Dark Rose',
    mode: 'dark',
    pageBg: '#160d12',
    sidebarBg: '#0f080d',
    cardBg: '#1c1018',
    drawerBg: '#22141e',
    inputBg: '#271824',
    accent: '#f43f5e',
    accentDark: '#e11d48',
    accentRgb: '244,63,94',
    inv: '255 255 255',
    textPrimary: 'white',
    glassBg: 'rgba(15,8,13,0.55)',
    inputFill: 'rgba(15,8,13,0.6)',
  },
  {
    key: 'light',
    name: 'Light Purple',
    mode: 'light',
    pageBg: '#f4f5fb',
    sidebarBg: '#ffffff',
    cardBg: '#ffffff',
    drawerBg: '#eef0fb',
    inputBg: '#f0f1f9',
    accent: '#7c6bff',
    accentDark: '#6456e8',
    accentRgb: '124,107,255',
    inv: '0 0 0',
    textPrimary: '#0f0f23',
    glassBg: 'rgba(255,255,255,0.80)',
    inputFill: 'rgba(240,241,249,0.9)',
  },
  {
    key: 'light-day',
    name: 'Light Day',
    mode: 'light',
    pageBg: '#f0f4f8',
    sidebarBg: '#ffffff',
    cardBg: '#ffffff',
    drawerBg: '#e8edf5',
    inputBg: '#eef1f6',
    accent: '#3b82f6',
    accentDark: '#2563eb',
    accentRgb: '59,130,246',
    inv: '0 0 0',
    textPrimary: '#0a1628',
    glassBg: 'rgba(255,255,255,0.80)',
    inputFill: 'rgba(238,241,246,0.9)',
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
  root.style.setProperty('--inv', theme.inv)
  root.style.setProperty('--text-primary', theme.textPrimary)
  root.style.setProperty('--glass-bg', theme.glassBg)
  root.style.setProperty('--input-fill', theme.inputFill)
  root.setAttribute('data-theme', theme.mode)
}
