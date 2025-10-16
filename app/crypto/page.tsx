'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Coins, TrendingUp, TrendingDown, Search, Filter, RefreshCw, Calculator } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import Link from 'next/link'

interface CryptoData {
  symbol: string
  name: string
  price: number
  priceAfn: number
  change24h: number
  changePercent24h: number
  volume24h: number
  marketCap: number
  trend: 'up' | 'down' | 'neutral'
}

export default function CryptoPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('marketCap')
  const [filterTrend, setFilterTrend] = useState('all')

  const { data: cryptoData, isLoading, refetch } = useQuery({
    queryKey: ['crypto-full'],
    queryFn: async (): Promise<CryptoData[]> => {
      const response = await fetch('/api/crypto')
      if (!response.ok) throw new Error('Failed to fetch crypto data')
      return response.json()
    },
    refetchInterval: 2 * 60 * 1000, // 2 minutes
  })

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Coins
  }

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
  }

  const filteredData = cryptoData?.filter(crypto => {
    const matchesSearch = crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTrend = filterTrend === 'all' || crypto.trend === filterTrend
    return matchesSearch && matchesTrend
  })

  const sortedData = filteredData?.sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return b.price - a.price
      case 'change':
        return b.changePercent24h - a.changePercent24h
      case 'volume':
        return b.volume24h - a.volume24h
      case 'name':
        return a.name.localeCompare(b.name)
      default: // marketCap
        return b.marketCap - a.marketCap
    }
  })

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            ارزهای دیجیتال
          </h1>
          <p className="text-lg text-muted-foreground">
            قیمت‌های لحظه‌ای ارزهای دیجیتال به دالر و افغانی
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <SelectItem value="marketCap">ارزش بازار</SelectItem>
                  <SelectItem value="price">قیمت</SelectItem>
                  <SelectItem value="change">تغییرات ۲۴ ساعت</SelectItem>
                  <SelectItem value="volume">حجم معاملات</SelectItem>
                  <SelectItem value="name">نام</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterTrend} onValueChange={setFilterTrend}>
                <SelectTrigger>
                  <SelectValue placeholder="روند" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="up">صعودی</SelectItem>
                  <SelectItem value="down">نزولی</SelectItem>
                  <SelectItem value="neutral">خنثی</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" asChild>
                <Link href="/calculator">
                  <Calculator className="h-4 w-4 mr-2" />
                  ماشین حساب
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Crypto Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }, (_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded mb-4"></div>
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            sortedData?.map((crypto) => {
              const TrendIcon = getTrendIcon(crypto.trend)
              
              return (
                <Card key={crypto.symbol} className="hover:shadow-lg transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {crypto.symbol.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-lg">{crypto.name}</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {crypto.symbol}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className={`p-2 rounded-full ${
                        crypto.trend === 'up' ? 'bg-green-100 dark:bg-green-900/20' :
                        crypto.trend === 'down' ? 'bg-red-100 dark:bg-red-900/20' :
                        'bg-gray-100 dark:bg-gray-900/20'
                      }`}>
                        <TrendIcon className={`h-4 w-4 ${getTrendColor(crypto.trend)}`} />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Prices */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">قیمت (USD)</span>
                        <span className="font-bold persian-numbers">
                          {formatCurrency(crypto.price, 'USD')}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">قیمت (AFN)</span>
                        <span className="font-bold persian-numbers">
                          {formatCurrency(crypto.priceAfn, 'AFN')}
                        </span>
                      </div>
                    </div>

                    {/* 24h Change */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">تغییرات ۲۴ ساعت</span>
                      <div className={`text-right ${getTrendColor(crypto.trend)}`}>
                        <div className="font-medium persian-numbers">
                          {formatPercentage(crypto.changePercent24h)}
                        </div>
                        <div className="text-xs persian-numbers">
                          {crypto.change24h > 0 ? '+' : ''}{formatCurrency(crypto.change24h, 'USD')}
                        </div>
                      </div>
                    </div>

                    {/* Volume and Market Cap */}
                    <div className="pt-3 border-t space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">حجم ۲۴ ساعت</span>
                        <span className="text-xs persian-numbers">
                          {formatCurrency(crypto.volume24h, 'USD')}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">ارزش بازار</span>
                        <span className="text-xs persian-numbers">
                          {formatCurrency(crypto.marketCap, 'USD')}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button className="w-full" size="sm" asChild>
                      <Link href={`/calculator?from=${crypto.symbol}&to=AFN`}>
                        محاسبه قیمت
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {sortedData && sortedData.length === 0 && !isLoading && (
          <Card>
            <CardContent className="text-center py-12">
              <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">ارز دیجیتالی یافت نشد</h3>
              <p className="text-muted-foreground">
                با فیلترهای انتخاب شده، ارز دیجیتالی یافت نشد. لطفاً فیلترها را تغییر دهید.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Educational Section */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <CardHeader>
            <CardTitle>آموزش ارزهای دیجیتال</CardTitle>
            <CardDescription>
              برای درک بهتر ارزهای دیجیتال، مطالب آموزشی ما را مطالعه کنید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">بیت کوین چیست؟</h3>
                <p className="text-sm text-muted-foreground">
                  آشنایی با اولین و محبوب‌ترین ارز دیجیتال جهان
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">نحوه خرید و فروش</h3>
                <p className="text-sm text-muted-foreground">
                  راهنمای گام به گام خرید و فروش ارزهای دیجیتال
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">امنیت و نگهداری</h3>
                <p className="text-sm text-muted-foreground">
                  نکات مهم برای نگهداری امن ارزهای دیجیتال
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <Button asChild>
                <Link href="/education">
                  مطالعه مطالب آموزشی
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}