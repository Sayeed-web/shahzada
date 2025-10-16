'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart3, TrendingUp, TrendingDown, Search, Filter, RefreshCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface CommodityData {
  symbol: string
  name: string
  price: number
  priceAfn: number
  change24h: number
  changePercent24h: number
  unit: string
  trend: 'up' | 'down' | 'neutral'
}

export default function CommoditiesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')

  const { data: commoditiesData, isLoading, refetch } = useQuery({
    queryKey: ['commodities-data'],
    queryFn: async (): Promise<CommodityData[]> => {
      const response = await fetch('/api/market/commodities')
      if (!response.ok) throw new Error('Failed to fetch commodities data')
      return response.json()
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : BarChart3
  }

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
  }

  const filteredData = commoditiesData?.filter(commodity => 
    commodity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    commodity.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedData = filteredData?.sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return b.price - a.price
      case 'change':
        return b.changePercent24h - a.changePercent24h
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return a.name.localeCompare(b.name)
    }
  })

  // Mock historical data for charts
  const generateHistoricalData = (basePrice: number) => {
    const data = []
    for (let i = 30; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const variation = (Math.random() - 0.5) * 0.1
      data.push({
        date: date.toISOString().split('T')[0],
        price: basePrice * (1 + variation),
        priceAfn: basePrice * (1 + variation) * 70.85
      })
    }
    return data
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            کالاهای اساسی
          </h1>
          <p className="text-lg text-muted-foreground">
            قیمت‌های لحظه‌ای طلا، نفت و سایر کالاهای اساسی
          </p>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                فیلتر و جستجو
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                بروزرسانی
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="جستجو در نام یا نماد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="مرتب‌سازی" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">نام</SelectItem>
                  <SelectItem value="price">قیمت</SelectItem>
                  <SelectItem value="change">تغییرات ۲۴ ساعت</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Commodities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }, (_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded mb-4"></div>
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-32 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            sortedData?.map((commodity) => {
              const TrendIcon = getTrendIcon(commodity.trend)
              const historicalData = generateHistoricalData(commodity.price)
              
              return (
                <Card key={commodity.symbol} className="hover:shadow-lg transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{commodity.name}</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {commodity.symbol}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className={`p-2 rounded-full ${
                        commodity.trend === 'up' ? 'bg-green-100 dark:bg-green-900/20' :
                        commodity.trend === 'down' ? 'bg-red-100 dark:bg-red-900/20' :
                        'bg-gray-100 dark:bg-gray-900/20'
                      }`}>
                        <TrendIcon className={`h-4 w-4 ${getTrendColor(commodity.trend)}`} />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Prices */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">قیمت (USD)</span>
                        <span className="font-bold persian-numbers">
                          {formatCurrency(commodity.price, 'USD')} / {commodity.unit}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">قیمت (AFN)</span>
                        <span className="font-bold persian-numbers">
                          {formatCurrency(commodity.priceAfn, 'AFN')} / {commodity.unit}
                        </span>
                      </div>
                    </div>

                    {/* 24h Change */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">تغییرات ۲۴ ساعت</span>
                      <div className={`text-right ${getTrendColor(commodity.trend)}`}>
                        <div className="font-medium persian-numbers">
                          {formatPercentage(commodity.changePercent24h)}
                        </div>
                        <div className="text-xs persian-numbers">
                          {commodity.change24h > 0 ? '+' : ''}{formatCurrency(commodity.change24h, 'USD')}
                        </div>
                      </div>
                    </div>

                    {/* Mini Chart */}
                    <div className="h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historicalData}>
                          <Line 
                            type="monotone" 
                            dataKey="price" 
                            stroke={commodity.trend === 'up' ? '#10b981' : '#ef4444'} 
                            strokeWidth={2}
                            dot={false}
                          />
                          <Tooltip 
                            formatter={(value: number) => [formatCurrency(value, 'USD'), 'قیمت']}
                            labelFormatter={(label) => `تاریخ: ${label}`}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {sortedData && sortedData.length === 0 && !isLoading && (
          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">کالایی یافت نشد</h3>
              <p className="text-muted-foreground">
                با فیلترهای انتخاب شده، کالایی یافت نشد. لطفاً فیلترها را تغییر دهید.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Market Analysis */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <CardHeader>
            <CardTitle>تحلیل بازار کالا</CardTitle>
            <CardDescription>
              بررسی روند قیمت‌های کالاهای اساسی
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">طلا</h3>
                <p className="text-sm text-muted-foreground">
                  طلا به عنوان پناهگاه امن در برابر تورم و بی‌ثباتی اقتصادی محسوب می‌شود
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">نفت خام</h3>
                <p className="text-sm text-muted-foreground">
                  قیمت نفت تحت تأثیر عوامل ژئوپلیتیک و تقاضای جهانی قرار دارد
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">نقره</h3>
                <p className="text-sm text-muted-foreground">
                  نقره هم کاربرد صنعتی دارد و هم به عنوان فلز گرانبها شناخته می‌شود
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}