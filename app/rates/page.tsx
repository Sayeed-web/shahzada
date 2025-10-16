'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ExchangeRates } from '@/components/dashboard/exchange-rates'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, TrendingDown, RefreshCw, Calculator, ArrowRightLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

interface ExchangeRate {
  from: string
  to: string
  rate: number
  lastUpdate: string
  source: string
}

const currencies = [
  { code: 'USD', name: 'دلار آمریکا', flag: '🇺🇸' },
  { code: 'EUR', name: 'یورو', flag: '🇪🇺' },
  { code: 'GBP', name: 'پوند انگلیس', flag: '🇬🇧' },
  { code: 'AFN', name: 'افغانی افغانستان', flag: '🇦🇫' },
  { code: 'PKR', name: 'روپیه پاکستان', flag: '🇵🇰' },
  { code: 'IRR', name: 'ریال ایران', flag: '🇮🇷' }
]

export default function RatesPage() {
  const [amount, setAmount] = useState('1000')
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('AFN')
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  const [converting, setConverting] = useState(false)

  const { data: rates, isLoading, refetch } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async (): Promise<ExchangeRate[]> => {
      const response = await fetch('/api/rates')
      if (!response.ok) throw new Error('Failed to fetch rates')
      return response.json()
    },
    refetchInterval: 5 * 60 * 1000,
  })

  const handleConvert = async () => {
    if (!amount || isNaN(Number(amount))) return
    
    setConverting(true)
    try {
      const response = await fetch(`/api/rates/convert?from=${fromCurrency}&to=${toCurrency}&amount=${amount}`)
      if (!response.ok) throw new Error('Failed to convert')
      const data = await response.json()
      setConvertedAmount(data.result)
    } catch (error) {
      console.error('Conversion error:', error)
    } finally {
      setConverting(false)
    }
  }

  const swapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
    setConvertedAmount(null)
  }

  const getMainRates = () => {
    if (!rates) return []
    return [
      rates.find(r => r.from === 'USD' && r.to === 'AFN'),
      rates.find(r => r.from === 'EUR' && r.to === 'AFN'),
      rates.find(r => r.from === 'PKR' && r.to === 'AFN')
    ].filter(Boolean) as ExchangeRate[]
  }

  const getTrendIcon = (rate: number) => {
    // Simple trend logic based on rate value
    return rate > 1 ? TrendingUp : TrendingDown
  }

  const getTrendColor = (rate: number) => {
    return rate > 1 ? 'text-green-600' : 'text-red-600'
  }

  useEffect(() => {
    if (amount && fromCurrency && toCurrency) {
      handleConvert()
    }
  }, [amount, fromCurrency, toCurrency])

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">نرخ ارز</h1>
            <p className="text-muted-foreground">
              نرخهای لحظهای ارزهای مختلف و تبدیل ارز
            </p>
          </div>
          <Button onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>
        </div>

        {/* Currency Converter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              تبدیل ارز
            </CardTitle>
            <CardDescription>
              تبدیل سریع بین ارزهای مختلف با نرخهای واقعی
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="amount">مقدار</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="fromCurrency">از ارز</Label>
                <div className="flex gap-2 mt-1">
                  <Select value={fromCurrency} onValueChange={setFromCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.flag} {currency.name} ({currency.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={swapCurrencies}>
                    <ArrowRightLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="toCurrency">به ارز</Label>
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(currency => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.flag} {currency.name} ({currency.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              {converting ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <div className="text-sm text-muted-foreground mt-2">در حال محاسبه...</div>
                </div>
              ) : convertedAmount !== null ? (
                <div>
                  <div className="text-2xl font-bold">
                    {convertedAmount.toLocaleString()} {toCurrency}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {amount} {fromCurrency} = {convertedAmount.toLocaleString()} {toCurrency}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  مقدار را وارد کنید
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Market Trends */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {getMainRates().map((rate) => {
            const TrendIcon = getTrendIcon(rate.rate)
            const trendColor = getTrendColor(rate.rate)
            
            return (
              <Card key={`${rate.from}-${rate.to}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{rate.from}/{rate.to}</CardTitle>
                  <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {rate.rate.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    آخرین بروزرسانی: {new Date(rate.lastUpdate).toLocaleTimeString('fa-IR')}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Exchange Rates Table */}
        <ExchangeRates />
      </div>
    </DashboardLayout>
  )
}