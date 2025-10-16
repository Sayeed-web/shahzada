'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  Edit
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency, getTimeAgo } from '@/lib/utils'
import Link from 'next/link'

export default function ProfilePage() {
  const { data: session } = useSession()

  const { data: userStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await fetch('/api/user/stats')
      if (!response.ok) throw new Error('Failed to fetch user stats')
      return response.json()
    },
    enabled: !!session,
  })

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return 'U'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      ADMIN: { label: 'مدیر سیستم', color: 'destructive' },
      SARAF: { label: 'صراف معتبر', color: 'default' },
      USER: { label: 'کاربر عادی', color: 'secondary' }
    }
    return badges[role as keyof typeof badges] || badges.USER
  }

  if (!session) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">لطفاً وارد حساب کاربری خود شوید</p>
        </div>
      </DashboardLayout>
    )
  }

  const roleBadge = getRoleBadge(session.user.role)

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            پروفایل کاربری
          </h1>
          <p className="text-lg text-muted-foreground">
            مشاهده و مدیریت اطلاعات حساب کاربری
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarFallback className="gradient-bg text-white text-2xl">
                    {getInitials(session.user.name)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl">{session.user.name}</CardTitle>
                <CardDescription>{session.user.email}</CardDescription>
                <Badge variant={roleBadge.color as any} className="mt-2">
                  {roleBadge.label}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{session.user.email}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">عضو از: {new Date().toLocaleDateString('fa-AF')}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">حساب تایید شده</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>

                <Button asChild className="w-full mt-4">
                  <Link href="/settings">
                    <Edit className="h-4 w-4 mr-2" />
                    ویرایش پروفایل
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {userStats && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    آمار سریع
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">تراکنش‌ها</span>
                    <span className="font-medium persian-numbers">{userStats.totalTransactions || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">حجم کل</span>
                    <span className="font-medium persian-numbers">
                      {formatCurrency(userStats.totalVolume || 0, 'AFN')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">آخرین ورود</span>
                    <span className="font-medium text-sm">همین الان</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  فعالیت‌های اخیر
                </CardTitle>
                <CardDescription>
                  آخرین فعالیت‌های حساب کاربری شما
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">ورود موفق به سیستم</p>
                      <p className="text-xs text-muted-foreground">همین الان</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">مشاهده نرخ‌های ارز</p>
                      <p className="text-xs text-muted-foreground">۵ دقیقه پیش</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">بروزرسانی پروفایل</p>
                      <p className="text-xs text-muted-foreground">۱ ساعت پیش</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  امنیت حساب
                </CardTitle>
                <CardDescription>
                  وضعیت امنیت و تنظیمات حساب کاربری
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">احراز هویت دو مرحله‌ای</p>
                      <p className="text-sm text-muted-foreground">امنیت اضافی برای حساب شما</p>
                    </div>
                    <Badge variant="outline">غیرفعال</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">رمز عبور قوی</p>
                      <p className="text-sm text-muted-foreground">آخرین تغییر: ۳۰ روز پیش</p>
                    </div>
                    <Badge variant="default">فعال</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">اعلان‌های امنیتی</p>
                      <p className="text-sm text-muted-foreground">هشدار برای ورود‌های مشکوک</p>
                    </div>
                    <Badge variant="default">فعال</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>ترجیحات</CardTitle>
                <CardDescription>
                  تنظیمات شخصی‌سازی حساب کاربری
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium mb-1">زبان</p>
                    <p className="text-sm text-muted-foreground">فارسی (افغانستان)</p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium mb-1">ارز پیش‌فرض</p>
                    <p className="text-sm text-muted-foreground">افغانی (؋)</p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium mb-1">منطقه زمانی</p>
                    <p className="text-sm text-muted-foreground">کابل (UTC+4:30)</p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium mb-1">تم</p>
                    <p className="text-sm text-muted-foreground">روشن</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}