import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useThemeStore, getTheme, applyTheme } from '@/store/themeStore'

export function AppLayout() {
  const { themeKey } = useThemeStore()

  useEffect(() => {
    applyTheme(getTheme(themeKey))
  }, [themeKey])

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--page-bg, #131326)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-6 scrollbar-thin" style={{ backgroundColor: 'var(--page-bg, #131326)' }}>
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
