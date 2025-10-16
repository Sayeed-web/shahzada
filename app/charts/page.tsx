'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, BarChart3, LineChart, Pencil, Layers } from 'lucide-react'
import { AdvancedTradingViewWidget } from '@/components/charts/AdvancedTradingViewWidget'

export default function ChartsPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSD')

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text mb-4 flex items-center justify-center gap-3">
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-emerald-600" />
            نمودارهای حرفهای معاملاتی
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
            پلتفرم تحلیل تکنیکال پیشرفته با تمام ابزارهای TradingView
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              نمودار پیشرفته - {selectedSymbol}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdvancedTradingViewWidget 
              symbol={selectedSymbol}
              onSymbolChange={setSelectedSymbol}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                ابزارهای ترسیم
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <div>• خطوط روند</div>
              <div>• فیبوناچی</div>
              <div>• الگوهای هارمونیک</div>
              <div>• مستطیل و دایره</div>
              <div>• پیکان و متن</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                اندیکاتورها
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <div>• میانگین متحرک (MA)</div>
              <div>• RSI و MACD</div>
              <div>• باندهای بولینگر</div>
              <div>• استوکاستیک</div>
              <div>• +100 اندیکاتور دیگر</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                بازه‌های زمانی
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <div>• 1 دقیقه تا 1 ماه</div>
              <div>• نمودار تیک</div>
              <div>• رنج و رنکو</div>
              <div>• هایکن آشی</div>
              <div>• کاگی و لاین بریک</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4" />
                قابلیت‌های پیشرفته
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <div>• ذخیره خودکار نمودار</div>
              <div>• مقایسه نمادها</div>
              <div>• تنظیمات سفارشی</div>
              <div>• اسکرین‌شات</div>
              <div>• تمام صفحه</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">میانبرهای نماد</h3>
              <p className="text-sm text-muted-foreground">
                برای دسترسی سریع به نمادهای افغانی از میانبرها استفاده کنید:
                <span className="font-mono mx-2">USDAFN</span>
                <span className="font-mono mx-2">EURAFN</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}