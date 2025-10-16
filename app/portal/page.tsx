'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, Building, DollarSign, Users, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

interface SarafStats {
  totalTransactions: number
  pendingTransactions: number
  completedTransactions: number
  totalVolume: number
  rating: number
  status: string
  activeRates: number
}

export default function PortalPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (session.user.role !== 'SARAF') {
      router.push('/')
      return
    }
  }, [session, status, router])

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['saraf-stats'],
    queryFn: async (): Promise<SarafStats> => {
      const response = await fetch('/api/portal/stats')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Stats API error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch stats')
      }
      return response.json()
    },
    enabled: !!session?.user && session.user.role === 'SARAF',
    retry: 1,
    staleTime: 30000
  })

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>در حال بارگذاری...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    return null
  }

  if (session.user.role !== 'SARAF') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-xl">دسترسی غیرمجاز</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold gradient-text mb-4">پورتال صراف</h1>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                <p>خطا در بارگذاری اطلاعات</p>
                <p className="text-sm mt-2">{error.message}</p>
                <Button onClick={() => window.location.reload()} className="mt-4">
                  تلاش مجدد
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">تایید شده</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">در انتظار تایید</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">رد شده</Badge>
      case 'SUSPENDED':
        return <Badge className="bg-gray-100 text-gray-800">تعلیق شده</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const quickActions = [
    {
      title: 'مدیریت نرخ‌ها',
      description: 'بروزرسانی نرخ‌های ارز',
      icon: DollarSign,
      href: '/portal/rates',
      color: 'bg-blue-500'
    },
    {
      title: 'تراکنش‌ها',
      description: 'مشاهده و مدیریت تراکنش‌ها',
      icon: Users,
      href: '/portal/transactions',
      color: 'bg-green-500'
    },
    {
      title: 'حواله جدید',
      description: 'ثبت حواله جدید',
      icon: Building,
      href: '/portal/hawala/new',
      color: 'bg-purple-500'
    },
    {
      title: 'مدیریت شعب',
      description: 'مدیریت شعب و نقاط خدماتی',
      icon: Building,
      href: '/portal/branches',
      color: 'bg-indigo-500'
    },
    {
      title: 'گزارشات',
      description: 'مشاهده گزارشات مالی',
      icon: TrendingUp,
      href: '/portal/reports',
      color: 'bg-orange-500'
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            پورتال صراف
          </h1>
          <p className="text-lg text-muted-foreground">
            مدیریت کسب و کار صرافی شما
          </p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>وضعیت حساب</CardTitle>
              </div>
              {stats && getStatusBadge(stats.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">نام کاربری</p>
                <p className="font-medium">{session.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ایمیل</p>
                <p className="font-medium">{session.user.email}</p>
              </div>
            </div>
            
            {stats?.status === 'PENDING' && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">
                    حساب شما در انتظار تایید مدیریت است. پس از تایید می‌توانید از تمام امکانات استفاده کنید.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {stats && stats.status === 'APPROVED' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">کل تراکنش‌ها</p>
                    <p className="text-2xl font-bold persian-numbers">{stats.totalTransactions}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">در انتظار</p>
                    <p className="text-2xl font-bold persian-numbers">{stats.pendingTransactions}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">تکمیل شده</p>
                    <p className="text-2xl font-bold persian-numbers">{stats.completedTransactions}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">امتیاز</p>
                    <p className="text-2xl font-bold persian-numbers">{stats.rating.toFixed(1)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        {stats && stats.status === 'APPROVED' && (
          <Card>
            <CardHeader>
              <CardTitle>عملیات سریع</CardTitle>
              <CardDescription>دسترسی سریع به امکانات مهم</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {quickActions.map((action) => (
                  <Button
                    key={action.href}
                    variant="ghost"
                    className="h-auto p-4 flex-col gap-2 text-center hover:scale-105 transition-all duration-200"
                    asChild
                  >
                    <Link href={action.href}>
                      <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center text-white mb-2`}>
                        <action.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{action.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {action.description}
                        </div>
                      </div>
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Getting Started */}
        {(!stats || stats.status !== 'APPROVED') && (
          <Card>
            <CardHeader>
              <CardTitle>شروع کار</CardTitle>
              <CardDescription>مراحل راه‌اندازی حساب صرافی</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                  ✓
                </div>
                <div>
                  <p className="font-medium">ثبت نام</p>
                  <p className="text-sm text-muted-foreground">حساب کاربری شما ایجاد شده است</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">تایید مدیریت</p>
                  <p className="text-sm text-muted-foreground">
                    {stats?.status === 'PENDING' ? 'در انتظار بررسی مدیریت' : 'تکمیل اطلاعات پروفایل'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg opacity-50">
                <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">شروع فعالیت</p>
                  <p className="text-sm text-muted-foreground">مدیریت نرخ‌ها و تراکنش‌ها</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}