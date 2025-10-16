'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Smartphone, Download, Star, Shield, Zap, Globe } from 'lucide-react'

export default function MobileAppPage() {
  const features = [
    {
      icon: Zap,
      title: 'سرعت بالا',
      description: 'دسترسی سریع به نرخهای ارز و انجام تراکنشها'
    },
    {
      icon: Shield,
      title: 'امنیت کامل',
      description: 'رمزگذاری پیشرفته و احراز هویت دو مرحلهای'
    },
    {
      icon: Globe,
      title: 'دسترسی آفلاین',
      description: 'مشاهده آخرین نرخها حتی بدون اینترنت'
    }
  ]

  const screenshots = [
    { title: 'صفحه اصلی', description: 'مشاهده نرخهای لحظهای' },
    { title: 'ماشین حساب', description: 'تبدیل سریع ارزها' },
    { title: 'پیگیری حواله', description: 'رهگیری آسان تراکنشها' }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            اپلیکیشن موبایل سرای شهزاده
          </h1>
          <p className="text-lg text-muted-foreground">
            دسترسی آسان و سریع به خدمات مالی در هر زمان و مکان
          </p>
        </div>

        {/* Hero Section */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Smartphone className="h-8 w-8 text-purple-600" />
                  <Badge className="bg-green-100 text-green-800">جدید</Badge>
                </div>
                <h2 className="text-3xl font-bold mb-4">
                  همه چیز در جیب شما
                </h2>
                <p className="text-muted-foreground mb-6">
                  با اپلیکیشن موبایل سرای شهزاده، تمام خدمات مالی را در دستان خود داشته باشید. 
                  نرخهای لحظهای، تبدیل ارز، پیگیری حواله و بسیاری از امکانات دیگر.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="flex items-center gap-2" onClick={() => {
                    const link = document.createElement('a')
                    link.href = '/shahzada.apk'
                    link.download = 'shahzada.apk'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }}>
                    <Download className="h-5 w-5" />
                    دانلود برای اندروید
                  </Button>
                  <Button size="lg" variant="outline" className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    دانلود برای iOS
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ۴.۸ از ۵ (۱۲۳۴ نظر)
                  </span>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="w-64 h-96 bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-2 shadow-2xl">
                  <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <Smartphone className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                      <p className="text-sm text-gray-600">پیش‌نمایش اپلیکیشن</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Screenshots */}
        <Card>
          <CardHeader>
            <CardTitle>تصاویر اپلیکیشن</CardTitle>
            <CardDescription>نگاهی به رابط کاربری زیبا و کاربردی</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {screenshots.map((screenshot, index) => (
                <div key={index} className="text-center">
                  <div className="w-full h-64 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center mb-4">
                    <Smartphone className="h-16 w-16 text-gray-400" />
                  </div>
                  <h4 className="font-medium mb-1">{screenshot.title}</h4>
                  <p className="text-sm text-muted-foreground">{screenshot.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Download Section */}
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">همین حالا دانلود کنید</h2>
            <p className="text-purple-100 mb-6">
              به میلیونها کاربر بپیوندید و از خدمات مالی پیشرفته استفاده کنید
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Google Play
              </Button>
              <Button size="lg" variant="secondary" className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                App Store
              </Button>
            </div>
            <p className="text-sm text-purple-200 mt-4">
              رایگان • سازگار با اندروید ۶+ و iOS ۱۲+
            </p>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>سوالات متداول</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h4 className="font-medium mb-2">آیا اپلیکیشن رایگان است؟</h4>
                <p className="text-sm text-muted-foreground">
                  بله، دانلود و استفاده از اپلیکیشن کاملاً رایگان است.
                </p>
              </div>
              <div className="border-b pb-4">
                <h4 className="font-medium mb-2">آیا اطلاعات من امن است؟</h4>
                <p className="text-sm text-muted-foreground">
                  ما از بالاترین استانداردهای امنیتی برای محافظت از اطلاعات شما استفاده می‌کنیم.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">چگونه می‌توانم پشتیبانی دریافت کنم؟</h4>
                <p className="text-sm text-muted-foreground">
                  از طریق بخش تماس با ما در اپلیکیشن یا وب‌سایت می‌توانید با تیم پشتیبانی در ارتباط باشید.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}