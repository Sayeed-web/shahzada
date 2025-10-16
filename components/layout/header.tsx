'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Menu, User, LogOut, Settings, Shield, PanelLeftClose, PanelLeftOpen, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NotificationBell } from './NotificationBell'
import { useLanguage } from '@/hooks/useLanguage'
import Link from 'next/link'

interface HeaderProps {
  onMenuClick: () => void
  onToggleCollapse?: () => void
  sidebarCollapsed?: boolean
}

export function Header({ onMenuClick, onToggleCollapse, sidebarCollapsed }: HeaderProps) {
  const { data: session } = useSession()
  const { t, language } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [key, setKey] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Force re-render when language changes
  useEffect(() => {
    setMounted(true)
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

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="destructive">{t('admin')}</Badge>
      case 'SARAF':
        return <Badge variant="default">{t('saraf')}</Badge>
      default:
        return <Badge variant="secondary">{t('user')}</Badge>
    }
  }

  return (
    <header key={key} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </Button>
        

        
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 gradient-bg rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs sm:text-sm">س</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold gradient-text hidden xs:block">
            {t('appName') || 'سرای شهزاده'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <LanguageSwitcher />
        
        {/* Theme Toggle - Always Visible */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="flex items-center justify-center"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}
        
        <NotificationBell />
        
        {session && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder-avatar.svg" alt={session.user.name || ''} />
                  <AvatarFallback>
                    {session.user.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">{session.user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session.user.email}
                </p>
                <div className="pt-1">
                  {getRoleBadge(session.user.role)}
                </div>
              </div>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>{t('profile')}</span>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t('settings')}</span>
                </Link>
              </DropdownMenuItem>
              
              {session.user.role === 'ADMIN' && (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="flex items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>{t('admin')}</span>
                  </Link>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}