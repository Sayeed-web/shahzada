'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, Users, Building, DollarSign, TrendingUp, Clock, CheckCircle, AlertTriangle, Settings, MessageSquare, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/hooks/useLanguage'
import { RecentActivityCard } from '@/components/admin/RecentActivityCard'
import { AdminChatWidget } from '@/components/chat/AdminChatWidget'
import { AdminMessagingDashboard } from '@/components/admin/AdminMessagingDashboard'
import { AdminFloatingChatButton } from '@/components/admin/AdminFloatingChatButton'

interface AdminStats {
  totalUsers: number
  totalSarafs: number
  pendingSarafs: number
  totalTransactions: number
  pendingTransactions: number
  totalVolume: number
  systemHealth: 'good' | 'warning' | 'error'
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }
  }, [session, status, router])

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      setIsLoading(true)
      setError(null)
      
      fetch('/api/admin/stats')
        .then(res => {
          if (!res.ok) {
            if (res.status === 503) {
              throw new Error('Database connection failed. Please check system status.')
            }
            if (res.status === 500) {
              throw new Error('Server error. Using fallback data.')
            }
            throw new Error(`Server error: ${res.status}`)
          }
          return res.json()
        })
        .then(data => {
          if (data.error && !data.fallback) {
            throw new Error(data.message || 'Failed to load statistics')
          }
          
          // Use fallback data if available
          if (data.fallback) {
            console.warn('Using fallback admin stats data')
          }
          
          setStats(data)
          setIsLoading(false)
        })
        .catch(error => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
          console.error('Failed to fetch admin stats:', errorMessage)
          
          // Set fallback stats on error
          setStats({
            totalUsers: 0,
            totalSarafs: 0,
            pendingSarafs: 0,
            totalTransactions: 0,
            pendingTransactions: 0,
            totalVolume: 0,
            systemHealth: 'warning'
          })
          
          setError(errorMessage)
          setIsLoading(false)
        })
    }
  }, [session])

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>{t('loading')}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    return null
  }

  if (session.user.role !== 'ADMIN') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-xl">دسترسی غیرمجاز</p>
        </div>
      </DashboardLayout>
    )
  }

  const quickActions = [
    {
      title: t('userManagement'),
      description: t('userManagement'),
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-500'
    },
    {
      title: t('sarafApproval'),
      description: t('sarafApproval'),
      icon: Building,
      href: '/admin/sarafs',
      color: 'bg-green-500',
      badge: stats?.pendingSarafs || 0
    },
    {
      title: 'مدیریت آموزش',
      description: 'دورهها و اخبار فناوری',
      icon: BookOpen,
      href: '/admin/education',
      color: 'bg-emerald-500'
    },
    {
      title: 'مدیریت ارتقاء',
      description: 'ارتقاء صرافان به پریمیوم',
      icon: TrendingUp,
      href: '/admin/promotions',
      color: 'bg-yellow-500'
    },
    {
      title: 'صرافان داشبورد',
      description: 'مدیریت نمایش در صفحه اصلی',
      icon: Building,
      href: '/admin/featured-sarafs',
      color: 'bg-pink-500'
    },
    {
      title: 'مدیریت محتوا',
      description: 'محتوای داشبورد و iframe',
      icon: Settings,
      href: '/admin/content',
      color: 'bg-indigo-500'
    },
    {
      title: t('transactionMonitoring'),
      description: t('transactionMonitoring'),
      icon: DollarSign,
      href: '/admin/transactions',
      color: 'bg-purple-500'
    },
    {
      title: t('systemReports'),
      description: t('systemReports'),
      icon: TrendingUp,
      href: '/admin/reports',
      color: 'bg-orange-500'
    }
  ]

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'good':
        return <Badge className="bg-green-100 text-green-800">سالم</Badge>
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">هشدار</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">خطا</Badge>
      default:
        return <Badge variant="secondary">نامشخص</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="text-center px-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text mb-4">
            {t('adminPanel')}
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
            {t('systemManagement')}
          </p>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                <CardTitle className="text-base sm:text-lg">{t('systemStatus')}</CardTitle>
              </div>
              {stats && getHealthBadge(stats.systemHealth)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">مدیر سیستم</p>
                <p className="text-sm sm:text-base font-medium">{session.user.name}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">آخرین ورود</p>
                <p className="text-sm sm:text-base font-medium">همین الان</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <Card>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t('totalUsers')}</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold persian-numbers">{stats.totalUsers}</p>
                  </div>
                  <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t('activeSarafs')}</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold persian-numbers">{stats.totalSarafs}</p>
                  </div>
                  <Building className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t('pendingApproval')}</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold persian-numbers">{stats.pendingSarafs}</p>
                  </div>
                  <Clock className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t('totalTransactions')}</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold persian-numbers">{stats.totalTransactions}</p>
                  </div>
                  <DollarSign className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t('pendingTransactions')}</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold persian-numbers">{stats.pendingTransactions}</p>
                  </div>
                  <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t('totalVolume')} (AFN)</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold persian-numbers">
                      {stats.totalVolume.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('quickActions')}</CardTitle>
            <CardDescription>دسترسی سریع به امکانات مدیریتی</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
              {quickActions.map((action) => (
                <Button
                  key={action.href}
                  variant="ghost"
                  className="h-auto p-2 sm:p-3 lg:p-4 flex-col gap-1 sm:gap-2 text-center hover:scale-105 transition-all duration-200 relative"
                  asChild
                >
                  <Link href={action.href}>
                    {action.badge && action.badge > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
                        {action.badge}
                      </Badge>
                    )}
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full ${action.color} flex items-center justify-center text-white mb-1 sm:mb-2`}>
                      <action.icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                    </div>
                    <div>
                      <div className="font-medium text-xs sm:text-sm lg:text-base">{action.title}</div>
                      <div className="text-xs sm:text-xs lg:text-sm text-muted-foreground hidden sm:block">
                        {action.description}
                      </div>
                    </div>
                  </Link>
                </Button>
              ))}

            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <RecentActivityCard />
        
        {/* Enterprise Messaging System */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  سیستم پیام‌رسانی مؤسسه‌ای
                </CardTitle>
                <CardDescription>مدیریت و پاسخ به پیام‌های کاربران</CardDescription>
              </div>
              <Button asChild>
                <Link href="/admin/chat">
                  مشاهده همه پیام‌ها
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AdminMessagingDashboard />
          </CardContent>
        </Card>
      </div>
      <AdminFloatingChatButton />
    </DashboardLayout>
  )
}