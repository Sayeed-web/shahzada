import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Check, Trash2, Settings, Filter } from 'lucide-react'

export default function NotificationsPage() {
  const notifications = [
    {
      id: '1',
      title: 'تراکنش جدید',
      message: 'تراکنش شماره HW-2024-001234 با موفقیت ثبت شد',
      type: 'transaction',
      time: '5 دقیقه پیش',
      read: false
    },
    {
      id: '2',
      title: 'تغییر نرخ ارز',
      message: 'نرخ دلار آمریکا به 70.50 افغانی رسید',
      type: 'rate',
      time: '15 دقیقه پیش',
      read: false
    },
    {
      id: '3',
      title: 'تایید حساب',
      message: 'حساب کاربری شما با موفقیت تایید شد',
      type: 'account',
      time: '1 ساعت پیش',
      read: true
    },
    {
      id: '4',
      title: 'بروزرسانی سیستم',
      message: 'سیستم با موفقیت بروزرسانی شد',
      type: 'system',
      time: '2 ساعت پیش',
      read: true
    }
  ]

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transaction': return '💰'
      case 'rate': return '📈'
      case 'account': return '👤'
      case 'system': return '⚙️'
      default: return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'transaction': return 'bg-green-100 text-green-800'
      case 'rate': return 'bg-blue-100 text-blue-800'
      case 'account': return 'bg-purple-100 text-purple-800'
      case 'system': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">اعلانات</h1>
            <p className="text-muted-foreground">
              مدیریت و مشاهده اعلانات سیستم
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              فیلتر
            </Button>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              تنظیمات
            </Button>
          </div>
        </div>

        {/* Notification Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">کل اعلانات</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">خوانده نشده</CardTitle>
              <Badge variant="destructive" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                {notifications.filter(n => !n.read).length}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.filter(n => !n.read).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">امروز</CardTitle>
              <div className="text-green-600">📅</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">این هفته</CardTitle>
              <div className="text-blue-600">📊</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button>
            <Check className="mr-2 h-4 w-4" />
            همه را خوانده علامت بزن
          </Button>
          <Button variant="outline">
            <Trash2 className="mr-2 h-4 w-4" />
            پاک کردن خوانده شده
          </Button>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>اعلانات اخیر</CardTitle>
            <CardDescription>
              لیست اعلانات دریافتی شما
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{notification.title}</h3>
                        <Badge className={getNotificationColor(notification.type)}>
                          {notification.type === 'transaction' && 'تراکنش'}
                          {notification.type === 'rate' && 'نرخ ارز'}
                          {notification.type === 'account' && 'حساب'}
                          {notification.type === 'system' && 'سیستم'}
                        </Badge>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {notification.time}
                        </span>
                        
                        <div className="flex gap-2">
                          {!notification.read && (
                            <Button size="sm" variant="ghost">
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}