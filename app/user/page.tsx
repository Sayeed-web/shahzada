'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, DollarSign, TrendingUp, Bell, History, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface UserStats {
  totalTransactions: number
  totalVolume: number
  unreadNotifications: number
  accountStatus: string
  recentActivity: Array<{
    id: string
    type: string
    description: string
    amount?: number
    status?: string
    timestamp: string
    referenceCode?: string
  }>
}

export default function UserPortal() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/user/stats')
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then(data => {
          setStats(data)
          setIsLoading(false)
        })
        .catch(error => {
          console.error('Failed to fetch user stats:', error)
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
            <p>در حال بارگذاری...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    return null
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">فعال</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">در انتظار</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">تعلیق شده</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'کمتر از یک ساعت پیش'
    if (diffInHours < 24) return `${diffInHours} ساعت پیش`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} روز پیش`
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">پنل کاربر</h1>
          {stats && getStatusBadge(stats.accountStatus)}
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">معاملات</p>
                  <p className="text-2xl font-bold persian-numbers">
                    {isLoading ? '...' : stats?.totalTransactions || 0}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">حجم (AFN)</p>
                  <p className="text-2xl font-bold persian-numbers">
                    {isLoading ? '...' : (stats?.totalVolume || 0).toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">اعلانات جدید</p>
                  <p className="text-2xl font-bold persian-numbers">
                    {isLoading ? '...' : stats?.unreadNotifications || 0}
                  </p>
                </div>
                <Bell className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">وضعیت حساب</p>
                  <p className="text-lg font-bold text-green-600">
                    {isLoading ? '...' : (stats?.accountStatus === 'active' ? 'فعال' : stats?.accountStatus)}
                  </p>
                </div>
                <User className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>عملیات سریع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-4 flex-col gap-2" asChild>
                <Link href="/hawala">
                  <DollarSign className="h-6 w-6" />
                  <span>حواله جدید</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col gap-2" asChild>
                <Link href="/charts">
                  <TrendingUp className="h-6 w-6" />
                  <span>نمودارهای بازار</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col gap-2" asChild>
                <Link href="/rates">
                  <ArrowRight className="h-6 w-6" />
                  <span>نرخ ارز</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>آخرین فعالیتها</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/user/transactions">
                  <History className="h-4 w-4 mr-2" />
                  مشاهده همه
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center text-muted-foreground py-4">
                  در حال بارگذاری...
                </div>
              ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{activity.description}</p>
                      {activity.referenceCode && (
                        <p className="text-xs text-muted-foreground">
                          کد پیگیری: {activity.referenceCode}
                        </p>
                      )}
                      {activity.amount && (
                        <p className="text-sm text-muted-foreground">
                          مبلغ: {activity.amount.toLocaleString()} 
                        </p>
                      )}
                    </div>
                    <div className="text-left">
                      {activity.status && (
                        <Badge 
                          variant={activity.status === 'COMPLETED' ? 'default' : 'secondary'}
                          className="mb-1"
                        >
                          {activity.status === 'COMPLETED' ? 'تکمیل شده' : 
                           activity.status === 'PENDING' ? 'در انتظار' : activity.status}
                        </Badge>
                      )}
                      <p className="text-sm text-gray-500">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>هنوز فعالیتی ثبت نشده است</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/hawala">اولین حواله خود را ثبت کنید</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}