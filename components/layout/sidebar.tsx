'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard, 
  Users, 
  Building, 
  DollarSign, 
  TrendingUp, 
  Settings, 
  Calculator,
  BarChart3,
  Coins,
  Package,
  Bell,
  User,
  CreditCard,
  FileText,
  Shield,
  MessageSquare,
  BookOpen
} from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'

interface SidebarProps {
  className?: string
  isOpen?: boolean
  onClose?: () => void
  userRole?: string
  collapsed?: boolean
}

export function Sidebar({ className, isOpen, onClose, userRole, collapsed }: SidebarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { t } = useLanguage()
  const [key, setKey] = useState(0)

  // Force re-render when language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      setKey(prev => prev + 1)
    }
    
    window.addEventListener('languageChange', handleLanguageChange)
    window.addEventListener('forceUpdate', handleLanguageChange)
    
    return () => {
      window.removeEventListener('languageChange', handleLanguageChange)
      window.removeEventListener('forceUpdate', handleLanguageChange)
    }
  }, [])

  const navigation = [
    {
      name: t('dashboard'),
      href: '/',
      icon: LayoutDashboard,
      roles: ['USER', 'SARAF', 'ADMIN']
    },
    {
      name: t('charts'),
      href: '/charts',
      icon: BarChart3,
      roles: ['USER', 'SARAF', 'ADMIN']
    },
    {
      name: t('crypto'),
      href: '/crypto',
      icon: Coins,
      roles: ['USER', 'SARAF', 'ADMIN']
    },
    {
      name: t('commodities'),
      href: '/commodities',
      icon: Package,
      roles: ['USER', 'SARAF', 'ADMIN']
    },
    {
      name: t('calculator'),
      href: '/calculator',
      icon: Calculator,
      roles: ['USER', 'SARAF', 'ADMIN']
    },
    {
      name: t('rates'),
      href: '/rates',
      icon: TrendingUp,
      roles: ['USER', 'SARAF', 'ADMIN']
    },
    {
      name: t('hawala'),
      href: '/hawala',
      icon: CreditCard,
      roles: ['USER', 'SARAF', 'ADMIN']
    },
    {
      name: t('sarafs'),
      href: '/sarafs',
      icon: Building,
      roles: ['USER', 'SARAF', 'ADMIN']
    },
    {
      name: t('education'),
      href: '/education',
      icon: BookOpen,
      roles: ['USER', 'SARAF', 'ADMIN']
    },
    {
      name: 'مدیریت',
      href: '/management',
      icon: Settings,
      roles: ['SARAF', 'ADMIN']
    }
  ]

  const sarafNavigation = [
    {
      name: t('portal'),
      href: '/portal',
      icon: Building,
      roles: ['SARAF']
    },
    {
      name: 'پیامها',
      href: '/portal/messages',
      icon: MessageSquare,
      roles: ['SARAF']
    },
    {
      name: 'حواله',
      href: '/portal/hawala',
      icon: CreditCard,
      roles: ['SARAF']
    },
    {
      name: 'شعب',
      href: '/portal/branches',
      icon: Building,
      roles: ['SARAF']
    },
    {
      name: t('transactions'),
      href: '/portal/transactions',
      icon: DollarSign,
      roles: ['SARAF']
    },
    {
      name: t('rates'),
      href: '/portal/rates',
      icon: TrendingUp,
      roles: ['SARAF']
    },
    {
      name: t('reports'),
      href: '/portal/reports',
      icon: FileText,
      roles: ['SARAF']
    }
  ]

  const adminNavigation = [
    {
      name: t('admin'),
      href: '/admin',
      icon: Shield,
      roles: ['ADMIN']
    },
    {
      name: 'مدیریت کاربران',
      href: '/admin/users',
      icon: Users,
      roles: ['ADMIN']
    },
    {
      name: 'مدیریت چت',
      href: '/admin/chat',
      icon: MessageSquare,
      roles: ['ADMIN']
    },
    {
      name: 'مدیریت صرافان',
      href: '/admin/sarafs',
      icon: Building,
      roles: ['ADMIN']
    },
    {
      name: 'تراکنشها',
      href: '/admin/transactions',
      icon: DollarSign,
      roles: ['ADMIN']
    },
    {
      name: 'گزارشات',
      href: '/admin/reports',
      icon: FileText,
      roles: ['ADMIN']
    },
    {
      name: 'مدیریت آموزش',
      href: '/admin/education',
      icon: BookOpen,
      roles: ['ADMIN']
    },
    {
      name: 'تنظیمات سیستم',
      href: '/admin/system',
      icon: Settings,
      roles: ['ADMIN']
    }
  ]

  const userNavigation = []

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const canAccess = (roles: string[]) => {
    return session?.user?.role && roles.includes(session.user.role)
  }

  const renderNavButton = (item: any) => (
    <Button
      key={item.href}
      variant={isActive(item.href) ? "secondary" : "ghost"}
      className={cn(
        "w-full",
        collapsed ? "justify-center px-2" : "justify-start"
      )}
      asChild
      title={collapsed ? item.name : undefined}
    >
      <Link href={item.href}>
        <item.icon className={cn(
          "h-4 w-4",
          collapsed ? "" : "mr-2"
        )} />
        {!collapsed && item.name}
      </Link>
    </Button>
  )

  return (
    <aside className={cn(
      "fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] transition-all duration-300 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700",
      collapsed ? "w-16" : "w-64",
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      className
    )}>
    <div key={key} className="pb-12 w-full h-full overflow-y-auto">
      <div className="space-y-4 py-4">
        {/* Main Navigation */}
        <div className={cn("px-3 py-2", collapsed && "px-1")}>
          {!collapsed && (
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              {t('navigation') || 'ناوبری'}
            </h2>
          )}
          <div className="space-y-1">
            {navigation.map((item) => (
              canAccess(item.roles) && renderNavButton(item)
            ))}
          </div>
        </div>

        {/* Saraf Portal */}
        {session?.user?.role === 'SARAF' && (
          <div className={cn("px-3 py-2", collapsed && "px-1")}>
            {!collapsed && (
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                {t('portal')}
              </h2>
            )}
            <div className="space-y-1">
              {sarafNavigation.map((item) => renderNavButton(item))}
            </div>
          </div>
        )}

        {/* Admin Panel */}
        {session?.user?.role === 'ADMIN' && (
          <div className={cn("px-3 py-2", collapsed && "px-1")}>
            {!collapsed && (
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                {t('adminPanel')}
              </h2>
            )}
            <div className="space-y-1">
              {adminNavigation.map((item) => renderNavButton(item))}
            </div>
          </div>
        )}


      </div>
    </div>
    </aside>
  )
}