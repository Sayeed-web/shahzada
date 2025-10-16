'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calculator, ArrowRightLeft, TrendingUp, History } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency } from '@/lib/utils'

const currencies = [
  { code: 'USD', name: 'دالر آمریکا', flag: '🇺🇸' },
  { code: 'EUR', name: 'یورو', flag: '🇪🇺' },
  { code: 'GBP', name: 'پوند انگلیس', flag: '🇬🇧' },
  { code: 'AFN', name: 'افغانی افغانستان', flag: '🇦🇫' },
  { code: 'PKR', name: 'روپیه پاکستان', flag: '🇵🇰' },
  { code: 'IRR', name: 'ریال ایران', flag: '🇮🇷' },
  { code: 'BTC', name: 'بیت کوین', flag: '₿' },
  { code: 'ETH', name: 'اتریوم', flag: 'Ξ' }
]

interface ConversionResult {
  from: string
  to: string
  amount: number
  result: number
  rate: number
}

interface HistoryItem extends ConversionResult {
  timestamp: number
}

export default function CalculatorPage() {
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('AFN')
  const [amount, setAmount] = useState('1')
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isConverting, setIsConverting] = useState(false)

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('calculator-history')
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error('Error loading history:', error)
      }
    }
  }, [])

  // Save history to localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('calculator-history', JSON.stringify(history))
    }
  }, [history])

  const { data: rates } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      const response = await fetch('/api/rates')
      if (!response.ok) throw new Error('Failed to fetch rates')
      return response.json()
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })

  const handleConvert = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setResult(null)
      return
    }

    setIsConverting(true)

    try {
      const response = await fetch(`/api/rates/convert?from=${fromCurrency}&to=${toCurrency}&amount=${amount}`)
      if (!response.ok) throw new Error('Failed to convert')
      
      const data = await response.json()
      setResult(data)

      // Add to history
      const historyItem: HistoryItem = {
        ...data,
        timestamp: Date.now()
      }
      
      setHistory(prev => [historyItem, ...prev.slice(0, 9)]) // Keep last 10 items
    } catch (error) {
      console.error('Conversion error:', error)
      setResult(null)
    } finally {
      setIsConverting(false)
    }
  }

  const swapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
    setResult(null)
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('calculator-history')
  }

  const getCurrentRate = useMemo(() => {
    if (!rates) return null
    
    const rate = rates.find((r: any) => 
      r.from === fromCurrency && r.to === toCurrency
    )
    
    return rate?.rate || null
  }, [rates, fromCurrency, toCurrency])

  const currentRate = getCurrentRate

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            ماشین حساب ارز
          </h1>
          <p className="text-lg text-muted-foreground">
            تبدیل دقیق ارزها با آخرین نرخ‌های بازار
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Calculator */}
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  تبدیل ارز
                </CardTitle>
                <CardDescription>
                  مبلغ و ارزهای مورد نظر را انتخاب کنید
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="amount">مبلغ</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="مبلغ را وارد کنید"
                    className="text-lg font-medium persian-numbers"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Currency Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>از</Label>
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{currency.flag}</span>
                              <div>
                                <div className="font-medium">{currency.code}</div>
                                <div className="text-xs text-muted-foreground">{currency.name}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>به</Label>
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{currency.flag}</span>
                              <div>
                                <div className="font-medium">{currency.code}</div>
                                <div className="text-xs text-muted-foreground">{currency.name}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={swapCurrencies}
                    className="rounded-full"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                  </Button>
                </div>

                {/* Current Rate Display */}
                {currentRate && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">نرخ فعلی:</span>
                      <div className="text-right">
                        <div className="font-medium persian-numbers">
                          1 {fromCurrency} = {currentRate.toFixed(4)} {toCurrency}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          آخرین بروزرسانی: {new Date().toLocaleTimeString('fa-AF')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Convert Button */}
                <Button 
                  onClick={handleConvert} 
                  className="w-full h-12 text-lg"
                  disabled={isConverting || !amount || isNaN(Number(amount))}
                >
                  {isConverting ? (
                    <div className="loading-spinner" />
                  ) : (
                    <>
                      <Calculator className="h-5 w-5 mr-2" />
                      تبدیل
                    </>
                  )}
                </Button>

                {/* Result */}
                {result && (
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                    <div className="text-center space-y-2">
                      <div className="text-sm text-muted-foreground">نتیجه تبدیل</div>
                      <div className="text-2xl sm:text-3xl font-bold persian-numbers">
                        {formatCurrency(result.result, result.to)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(result.amount, result.from)} = {formatCurrency(result.result, result.to)}
                      </div>
                      <div className="text-xs text-muted-foreground persian-numbers">
                        نرخ: {result.rate.toFixed(6)}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* History & Quick Actions */}
          <div className="space-y-6">
            {/* Quick Conversions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  تبدیل‌های سریع
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { from: 'USD', to: 'AFN', amount: 100 },
                  { from: 'EUR', to: 'AFN', amount: 100 },
                  { from: 'AFN', to: 'USD', amount: 1000 },
                  { from: 'BTC', to: 'USD', amount: 1 }
                ].map((quick, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-between h-auto p-3"
                    onClick={() => {
                      setFromCurrency(quick.from)
                      setToCurrency(quick.to)
                      setAmount(quick.amount.toString())
                    }}
                  >
                    <span className="persian-numbers">
                      {quick.amount} {quick.from}
                    </span>
                    <ArrowRightLeft className="h-3 w-3" />
                    <span>{quick.to}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* History */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    تاریخچه
                  </CardTitle>
                  {history.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearHistory}>
                      پاک کردن
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    تاریخچه تبدیل خالی است
                  </p>
                ) : (
                  <div className="space-y-2">
                    {history.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setFromCurrency(item.from)
                          setToCurrency(item.to)
                          setAmount(item.amount.toString())
                          setResult(item)
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="text-sm">
                            <div className="font-medium persian-numbers">
                              {formatCurrency(item.amount, item.from)}
                            </div>
                            <div className="text-muted-foreground persian-numbers">
                              = {formatCurrency(item.result, item.to)}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleTimeString('fa-AF', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}