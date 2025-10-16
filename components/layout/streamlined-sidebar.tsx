'use client'

import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { 
  Home, Settings, LogOut, Shield, Building2, User,
  BarChart3, Calculator, TrendingUp, Coins, ChevronLeft, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StreamlinedSidebarProps {
  isOpen: boolean
  onClose: () => void
  userRole: string
  collapsed?: boolean
  onToggleCollapse?: () => void
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  isPortal?: boolean
}

export function StreamlinedSidebar({ isOpen, onClose, userRole, collapsed = false, onToggleCollapse }: StreamlinedSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleNavigation = (href: string) => {
    router.push(href)
    onClose()
  }

  const handleSignOut = async () => {
    if (userRole === 'VISITOR') {
      router.push('/auth/signin')
    } else {
      await signOut({ callbackUrl: '/' })
    }
  }

  // Get portal options based on user role
  const getPortalOptions = () => {
    const portals: NavItem[] = []
    
    if (userRole === 'ADMIN') {
      portals.push({
        name: 'پنل مدیریت',
        href: '/admin',
        icon: Shield,
        isPortal: true
      })
    }
    
    if (userRole === 'SARAF' || userRole === 'ADMIN') {
      portals.push({
        name: 'پنل صراف',
        href: '/portal',
        icon: Building2,
        isPortal: true
      })
    }
    
    if (userRole === 'USER') {
      portals.push({
        name: 'پنل کاربر',
        href: '/user',
        icon: User,
        isPortal: true
      })
    }
    
    return portals
  }

  const portals = getPortalOptions()
  
  const tools: NavItem[] = [
    {
      name: 'نمودارها',
      href: '/charts',
      icon: BarChart3
    },
    {
      name: 'ماشین حساب',
      href: '/calculator',
      icon: Calculator
    },
    {
      name: 'کالاها',
      href: '/commodities',
      icon: TrendingUp
    },
    {
      name: 'ارزهای دیجیتال',
      href: '/crypto',
      icon: Coins
    },
    {
      name: 'تنظیمات',
      href: '/settings',
      icon: Settings
    }
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center flex-shrink-0 px-4 py-4 justify-between">
        <div className={cn(
          "flex items-center space-x-3 space-x-reverse",
          collapsed && "justify-center w-full"
        )}>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">س</span>
          </div>
          {!collapsed && (
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              سرای شهزاده
            </h2>
          )}
        </div>
        {onToggleCollapse && !collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="hidden lg:flex h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Collapse/Expand Button - Outside Logo Area */}
      {onToggleCollapse && collapsed && (
        <div className="px-4 pb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="w-full h-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="hidden">
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {/* Dashboard */}
        <div className="space-y-1">
          <button
            onClick={() => handleNavigation('/')}
            className={cn(
              'w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              collapsed ? 'justify-center' : 'text-right',
              pathname === '/'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            )}
            title={collapsed ? 'داشبورد' : undefined}
          >
            <Home className={cn(
              "h-5 w-5 flex-shrink-0",
              collapsed ? "" : "ml-3"
            )} />
            {!collapsed && 'داشبورد'}
          </button>
        </div>

        {/* Portal Section */}
        {portals.length > 0 && (
          <div>
            {!collapsed && (
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                پنل مدیریت
              </h3>
            )}
            <div className="space-y-2">
              {portals.map((item) => {
                const isActive = pathname.startsWith(item.href)
                
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      'w-full flex items-center py-3 text-sm font-semibold rounded-lg transition-all border-2',
                      collapsed ? 'justify-center px-2' : 'text-right px-4',
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-500 shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 flex-shrink-0",
                      collapsed ? "" : "ml-3"
                    )} />
                    {!collapsed && item.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Tools Section */}
        <div>
          {!collapsed && (
            <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              ابزارها
            </h3>
          )}
          <div className="space-y-1">
            {tools.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href))
              
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    'w-full flex items-center py-2 text-sm font-medium rounded-lg transition-colors',
                    collapsed ? 'justify-center px-2' : 'text-right px-3',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    collapsed ? "" : "ml-3"
                  )} />
                  {!collapsed && item.name}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* User Section */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
        {!collapsed && (
          <div className="mb-3 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">نقش کاربری</p>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${
                userRole === 'ADMIN' ? 'bg-red-500' :
                userRole === 'SARAF' ? 'bg-blue-500' : 
                userRole === 'VISITOR' ? 'bg-gray-500' : 'bg-green-500'
              }`} />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {userRole === 'ADMIN' ? 'مدیر سیستم' : 
                 userRole === 'SARAF' ? 'صراف' : 
                 userRole === 'VISITOR' ? 'بازدیدکننده' : 'کاربر عادی'}
              </p>
            </div>
          </div>
        )}
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className={cn(
            "w-full hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600",
            collapsed ? "justify-center px-2" : "justify-start text-right"
          )}
          title={collapsed ? 'خروج' : undefined}
        >
          <LogOut className={cn(
            "h-5 w-5",
            collapsed ? "" : "ml-3"
          )} />
          {!collapsed && (userRole === 'VISITOR' ? 'ورود' : 'خروج')}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 transition-all duration-300 lg:pt-14 xl:pt-16",
        collapsed ? "lg:w-16" : "lg:w-64"
      )}>
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={cn(
        'lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out shadow-lg',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent />
      </div>
    </>
  )
}