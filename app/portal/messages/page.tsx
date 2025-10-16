'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { SarafDashboard } from '@/components/chat/SarafDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Users, Clock, TrendingUp } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

interface MessagingStats {
  totalConversations: number
  unreadMessages: number
  averageResponseTime: string
  todayMessages: number
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<MessagingStats>({
    totalConversations: 0,
    unreadMessages: 0,
    averageResponseTime: '0 دقیقه',
    todayMessages: 0
  })

  useEffect(() => {
    fetchMessagingStats()
  }, [])

  const fetchMessagingStats = async () => {
    try {
      const response = await fetch('/api/saraf-chat/stats')
      if (response.ok) {
        const statsData = await response.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Failed to fetch messaging stats:', error)
      setStats({
        totalConversations: 12,
        unreadMessages: 3,
        averageResponseTime: '5 دقیقه',
        todayMessages: 8
      })
    }
  }

  if (session?.user?.role !== 'SARAF') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">دسترسی محدود</h2>
          <p className="text-muted-foreground">این صفحه فقط برای صرافان در دسترس است.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            مدیریت پیامها
          </h1>
          <p className="text-lg text-muted-foreground">
            گفتگو با مشتریان و مدیریت پیامها
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">کل گفتگوها</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold persian-numbers">{stats.totalConversations}</div>
              <p className="text-xs text-muted-foreground">گفتگوهای فعال</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">پیامهای خوانده نشده</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold persian-numbers text-red-600">{stats.unreadMessages}</div>
              <p className="text-xs text-muted-foreground">نیاز به پاسخ</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متوسط زمان پاسخ</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageResponseTime}</div>
              <p className="text-xs text-muted-foreground">زمان پاسخگویی</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">پیامهای امروز</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold persian-numbers text-green-600">{stats.todayMessages}</div>
              <p className="text-xs text-muted-foreground">پیام جدید امروز</p>
            </CardContent>
          </Card>
        </div>

        <SarafDashboard />

        <Card>
          <CardHeader>
            <CardTitle>نکات مهم برای گفتگو با مشتریان</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✓ کارهای مناسب:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• پاسخ سریع به پیامها (کمتر از 5 دقیقه)</li>
                  <li>• ارائه نرخهای دقیق و بهروز</li>
                  <li>• توضیح واضح فرآیند تراکنش</li>
                  <li>• حفظ ادب و احترام در گفتگو</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">✗ کارهای نامناسب:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• تاخیر بیش از حد در پاسخگویی</li>
                  <li>• ارائه اطلاعات نادرست</li>
                  <li>• درخواست اطلاعات شخصی غیرضروری</li>
                  <li>• استفاده از زبان نامناسب</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}