'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, Shield, Building2, BarChart3, Settings, 
  Activity, DollarSign, TrendingUp, AlertCircle,
  UserCheck, Clock, CheckCircle, XCircle
} from 'lucide-react'

interface UserStats {
  totalUsers: number
  activeUsers: number
  newUsers: number
  sarafs: number
}

interface SystemStats {
  totalTransactions: number
  totalVolume: number
  systemHealth: 'healthy' | 'warning' | 'critical'
  uptime: string
}

export default function ManagementPortal() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    sarafs: 0
  })
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalTransactions: 0,
    totalVolume: 0,
    systemHealth: 'healthy',
    uptime: '99.9%'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchStats()
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      const [usersRes, systemRes] = await Promise.all([
        fetch('/api/admin/stats/users'),
        fetch('/api/admin/stats/system')
      ])

      if (usersRes.ok) {
        const userData = await usersRes.json()
        setUserStats(userData)
      }

      if (systemRes.ok) {
        const systemData = await systemRes.json()
        setSystemStats(systemData)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPortalAccess = () => {
    const role = session?.user?.role
    return {
      admin: role === 'ADMIN',
      saraf: role === 'ADMIN' || role === 'SARAF',
      user: true
    }
  }

  const access = getPortalAccess()

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            پورتال مدیریت سرای شهزاده
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            مدیریت جامع سیستم مالی و صرافی
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    کل کاربران
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userStats.totalUsers.toLocaleString()}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    کاربران فعال
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userStats.activeUsers.toLocaleString()}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    صرافان
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userStats.sarafs.toLocaleString()}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    سلامت سیستم
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={systemStats.systemHealth === 'healthy' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {systemStats.systemHealth === 'healthy' ? 'سالم' : 'خطا'}
                    </Badge>
                  </div>
                </div>
                <Activity className={`h-8 w-8 ${
                  systemStats.systemHealth === 'healthy' ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portal Access Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نمای کلی</TabsTrigger>
            {access.admin && <TabsTrigger value="admin">پنل ادمین</TabsTrigger>}
            {access.saraf && <TabsTrigger value="saraf">پنل صراف</TabsTrigger>}
            <TabsTrigger value="user">پنل کاربر</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    آمار معاملات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        کل معاملات
                      </span>
                      <span className="font-semibold">
                        {systemStats.totalTransactions.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        حجم کل
                      </span>
                      <span className="font-semibold">
                        ${systemStats.totalVolume.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        آپتایم سیستم
                      </span>
                      <span className="font-semibold text-green-600">
                        {systemStats.uptime}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    فعالیت‌های اخیر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">کاربر جدید ثبت‌نام کرد</span>
                      <span className="text-xs text-gray-500 mr-auto">۵ دقیقه پیش</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">معامله جدید انجام شد</span>
                      <span className="text-xs text-gray-500 mr-auto">۱۰ دقیقه پیش</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">هشدار سیستمی</span>
                      <span className="text-xs text-gray-500 mr-auto">۱۵ دقیقه پیش</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Admin Tab */}
          {access.admin && (
            <TabsContent value="admin" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push('/admin/users')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-semibold">مدیریت کاربران</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          مدیریت کاربران و دسترسی‌ها
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push('/admin/sarafs')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Building2 className="h-8 w-8 text-purple-600" />
                      <div>
                        <h3 className="font-semibold">مدیریت صرافان</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          تأیید و مدیریت صرافان
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push('/admin/system-config')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Settings className="h-8 w-8 text-gray-600" />
                      <div>
                        <h3 className="font-semibold">تنظیمات سیستم</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          پیکربندی سیستم
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push('/admin/analytics')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <BarChart3 className="h-8 w-8 text-green-600" />
                      <div>
                        <h3 className="font-semibold">آنالیتیکس</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          گزارشات و آمار سیستم
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push('/admin/transactions')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <DollarSign className="h-8 w-8 text-yellow-600" />
                      <div>
                        <h3 className="font-semibold">مدیریت معاملات</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          نظارت بر معاملات
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push('/admin/reports')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Activity className="h-8 w-8 text-red-600" />
                      <div>
                        <h3 className="font-semibold">گزارشات</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          گزارشات مالی و عملکرد
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Saraf Tab */}
          {access.saraf && (
            <TabsContent value="saraf" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push('/portal/transactions')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <DollarSign className="h-8 w-8 text-green-600" />
                      <div>
                        <h3 className="font-semibold">معاملات من</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          مدیریت معاملات صرافی
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push('/portal/rates')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-semibold">نرخ‌های ارز</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          مدیریت نرخ‌های ارز
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push('/portal/hawala')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Building2 className="h-8 w-8 text-purple-600" />
                      <div>
                        <h3 className="font-semibold">حواله‌ها</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          مدیریت حواله‌های بانکی
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push('/portal/reports')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <BarChart3 className="h-8 w-8 text-orange-600" />
                      <div>
                        <h3 className="font-semibold">گزارشات مالی</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          گزارشات درآمد و سود
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push('/portal/stats')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Activity className="h-8 w-8 text-red-600" />
                      <div>
                        <h3 className="font-semibold">آمار عملکرد</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          آمار و تحلیل عملکرد
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* User Tab */}
          <TabsContent value="user" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push('/dashboard')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">داشبورد</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        نمای کلی حساب کاربری
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push('/calculator')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold">ماشین حساب</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        تبدیل ارز و محاسبات
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push('/charts')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div>
                      <h3 className="font-semibold">نمودارها</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        نمودارهای قیمت ارز
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push('/commodities')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Activity className="h-8 w-8 text-yellow-600" />
                    <div>
                      <h3 className="font-semibold">کالاها</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        قیمت طلا، نقره و نفت
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push('/crypto')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Activity className="h-8 w-8 text-orange-600" />
                    <div>
                      <h3 className="font-semibold">ارزهای دیجیتال</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        قیمت بیت‌کوین و ارزهای دیجیتال
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push('/settings')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Settings className="h-8 w-8 text-gray-600" />
                    <div>
                      <h3 className="font-semibold">تنظیمات</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        تنظیمات حساب کاربری
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}