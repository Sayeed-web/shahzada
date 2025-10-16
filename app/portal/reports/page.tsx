'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, DollarSign, Users, Calendar, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'

interface SarafReportData {
  totalTransactions: number
  totalVolume: number
  totalFees: number
  averageTransaction: number
  monthlyGrowth: number
  topCurrencies: Array<{
    currency: string
    volume: number
    count: number
  }>
  dailyStats: Array<{
    date: string
    transactions: number
    volume: number
  }>
}

export default function PortalReportsPage() {
  const { data: session } = useSession()
  const [period, setPeriod] = useState('30d')

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['saraf-reports', period],
    queryFn: async (): Promise<SarafReportData> => {
      const response = await fetch(`/api/portal/reports?period=${period}`)
      if (!response.ok) throw new Error('Failed to fetch reports')
      return response.json()
    },
    enabled: session?.user?.role === 'SARAF'
  })

  if (session?.user?.role !== 'SARAF') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">دسترسی غیرمجاز</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <h1 className="text-4xl font-bold gradient-text mb-4">
              گزارشات مالی
            </h1>
            <p className="text-lg text-muted-foreground">
              آمار و گزارشات عملکرد صرافی
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-48">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">۷ روز گذشته</SelectItem>
                <SelectItem value="30d">۳۰ روز گذشته</SelectItem>
                <SelectItem value="90d">۹۰ روز گذشته</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              دانلود گزارش
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="loading-spinner mx-auto" />
            <p className="text-muted-foreground mt-2">در حال تولید گزارش...</p>
          </div>
        ) : reportData ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">کل تراکنشها</p>
                      <p className="text-2xl font-bold">{reportData.totalTransactions}</p>
                      <p className="text-xs text-green-600">+{reportData.monthlyGrowth}% این ماه</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">حجم کل</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(reportData.totalVolume, 'AFN')}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">کل کارمزد</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(reportData.totalFees, 'AFN')}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">میانگین تراکنش</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(reportData.averageTransaction, 'AFN')}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Currencies */}
            <Card>
              <CardHeader>
                <CardTitle>ارزهای پرتراکنش</CardTitle>
                <CardDescription>ارزهایی که بیشترین حجم تراکنش را داشتهاند</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.topCurrencies.map((currency, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{currency.currency}</p>
                          <p className="text-sm text-muted-foreground">
                            {currency.count} تراکنش
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(currency.volume, currency.currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Daily Performance */}
            <Card>
              <CardHeader>
                <CardTitle>عملکرد روزانه</CardTitle>
                <CardDescription>آمار تراکنشهای روزانه</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.dailyStats.slice(0, 7).map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{new Date(day.date).toLocaleDateString('fa-AF')}</p>
                        <p className="text-sm text-muted-foreground">{day.transactions} تراکنش</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(day.volume, 'AFN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">خطا در بارگذاری گزارشات</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}