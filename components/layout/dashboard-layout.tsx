'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from './header'
import { StreamlinedSidebar } from './streamlined-sidebar'
import { UserChatWidget } from '@/components/chat/UserChatWidget'
import { AdminFloatingChatButton } from '@/components/admin/AdminFloatingChatButton'
import { UserSarafChatButton } from '@/components/chat/UserSarafChatButton'
import { useLanguage } from '@/hooks/useLanguage'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { language } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      const collapsed = localStorage.getItem('sidebarCollapsed') === 'true'
      setSidebarCollapsed(collapsed)
    }
  }, [mounted])

  // Handle authentication state properly
  useEffect(() => {
    if (status === 'loading') return
    
    // Allow public access to main dashboard, but redirect for protected routes
    const protectedRoutes = ['/admin', '/portal', '/user']
    const currentPath = window.location.pathname
    
    if (!session && protectedRoutes.some(route => currentPath.startsWith(route))) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  const toggleSidebarCollapse = () => {
    const newCollapsed = !sidebarCollapsed
    setSidebarCollapsed(newCollapsed)
    if (mounted) {
      localStorage.setItem('sidebarCollapsed', newCollapsed.toString())
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 prevent-overflow ${language === 'fa' || language === 'ps' ? 'rtl' : 'ltr'}`}>
      <Header 
        onMenuClick={handleMenuClick} 
        onToggleCollapse={toggleSidebarCollapse}
        sidebarCollapsed={sidebarCollapsed}
      />
      
      <div className="flex">
        <StreamlinedSidebar 
          isOpen={sidebarOpen} 
          onClose={handleSidebarClose}
          userRole={session?.user?.role || 'VISITOR'}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />
        
        <main className={cn(
          "flex-1 min-h-screen transition-all duration-300 pt-14 sm:pt-16 prevent-overflow",
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        )}>
          <div className="p-2 sm:p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={handleSidebarClose}
        />
      )}
      
      {/* Chat Widgets */}
      {session?.user?.role === 'ADMIN' ? (
        <AdminFloatingChatButton />
      ) : (
        <>
          <UserChatWidget />
          <UserSarafChatButton />
        </>
      )}
    </div>
  )
}