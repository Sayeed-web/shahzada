'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, Plus, Edit, Trash2, TrendingUp, DollarSign } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface Rate {
  id: string
  fromCurrency: string
  toCurrency: string
  buyRate: number
  sellRate: number
  isActive: boolean
  validUntil?: string
  createdAt: string
  updatedAt: string
}

const CURRENCIES = [
  { code: 'AFN', name: 'افغانی افغانستان', flag: '🇦🇫' },
  { code: 'USD', name: 'دلار آمریکا', flag: '🇺🇸' },
  { code: 'EUR', name: 'یورو', flag: '🇪🇺' },
  { code: 'GBP', name: 'پوند انگلیس', flag: '🇬🇧' },
  { code: 'PKR', name: 'روپیه پاکستان', flag: '🇵🇰' },
  { code: 'IRR', name: 'ریال ایران', flag: '🇮🇷' },
  { code: 'INR', name: 'روپیه هند', flag: '🇮🇳' },
  { code: 'SAR', name: 'ریال سعودی', flag: '🇸🇦' },
  { code: 'AED', name: 'درهم امارات', flag: '🇦🇪' }
]

export default function RateManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [rates, setRates] = useState<Rate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<Rate | null>(null)
  const [formData, setFormData] = useState({
    fromCurrency: '',
    toCurrency: '',
    buyRate: '',
    sellRate: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (session.user.role !== 'SARAF') {
      router.push('/')
      return
    }
  }, [session, status, router])

  const fetchRates = async () => {
    if (!session?.user?.sarafId) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/portal/rates')
      if (response.ok) {
        const data = await response.json()
        setRates(data)
      }
    } catch (error) {
      console.error('Failed to fetch rates:', error)
      toast({
        title: 'خطا',
        description: 'دریافت نرخها با خطا مواجه شد',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRates()
  }, [session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.fromCurrency || !formData.toCurrency || !formData.buyRate || !formData.sellRate) {
      toast({
        title: 'خطا',
        description: 'لطفاً تمام فیلدها را پر کنید',
        variant: 'destructive'
      })
      return
    }

    try {
      const url = editingRate ? '/api/portal/rates' : '/api/portal/rates'
      const method = editingRate ? 'PATCH' : 'POST'
      const body = editingRate 
        ? { id: editingRate.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        toast({
          title: 'موفق',
          description: editingRate ? 'نرخ بروزرسانی شد' : 'نرخ جدید اضافه شد'
        })
        setIsDialogOpen(false)
        setEditingRate(null)
        setFormData({ fromCurrency: '', toCurrency: '', buyRate: '', sellRate: '' })
        fetchRates()
      } else {
        throw new Error('Failed to save rate')
      }
    } catch (error) {
      console.error('Failed to save rate:', error)
      toast({
        title: 'خطا',
        description: 'ذخیره نرخ با خطا مواجه شد',
        variant: 'destructive'
      })
    }
  }

  const handleToggleActive = async (rate: Rate) => {
    try {
      const response = await fetch('/api/portal/rates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rate.id,
          isActive: !rate.isActive
        })
      })

      if (response.ok) {
        toast({
          title: 'موفق',
          description: `نرخ ${rate.isActive ? 'غیرفعال' : 'فعال'} شد`
        })
        fetchRates()
      }
    } catch (error) {
      console.error('Failed to toggle rate:', error)
      toast({
        title: 'خطا',
        description: 'تغییر وضعیت نرخ با خطا مواجه شد',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (rate: Rate) => {
    setEditingRate(rate)
    setFormData({
      fromCurrency: rate.fromCurrency,
      toCurrency: rate.toCurrency,
      buyRate: rate.buyRate.toString(),
      sellRate: rate.sellRate.toString()
    })
    setIsDialogOpen(true)
  }

  const getCurrencyDisplay = (code: string) => {
    const currency = CURRENCIES.find(c => c.code === code)
    return currency ? `${currency.flag} ${currency.name} (${code})` : code
  }

  if (status === 'loading' || !session) {
    return <div>در حال بارگذاری...</div>
  }

  if (session.user.role !== 'SARAF') {
    return <div>دسترسی غیرمجاز</div>
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/portal">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">مدیریت نرخها</h1>
              <p className="text-muted-foreground">
                مدیریت نرخهای خرید و فروش ارز
              </p>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingRate(null)
                setFormData({ fromCurrency: '', toCurrency: '', buyRate: '', sellRate: '' })
              }}>
                <Plus className="h-4 w-4 mr-2" />
                نرخ جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingRate ? 'ویرایش نرخ' : 'افزودن نرخ جدید'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fromCurrency">از ارز</Label>
                    <Select 
                      value={formData.fromCurrency} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, fromCurrency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب ارز" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(currency => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.flag} {currency.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="toCurrency">به ارز</Label>
                    <Select 
                      value={formData.toCurrency} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, toCurrency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب ارز" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(currency => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.flag} {currency.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="buyRate">نرخ خرید</Label>
                    <Input
                      id="buyRate"
                      type="number"
                      step="0.01"
                      value={formData.buyRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, buyRate: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sellRate">نرخ فروش</Label>
                    <Input
                      id="sellRate"
                      type="number"
                      step="0.01"
                      value={formData.sellRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, sellRate: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    لغو
                  </Button>
                  <Button type="submit">
                    {editingRate ? 'بروزرسانی' : 'افزودن'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">کل نرخها</p>
                  <p className="text-2xl font-bold persian-numbers">{rates.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">نرخهای فعال</p>
                  <p className="text-2xl font-bold persian-numbers">
                    {rates.filter(r => r.isActive).length}
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
                  <p className="text-sm text-muted-foreground">نرخهای غیرفعال</p>
                  <p className="text-2xl font-bold persian-numbers">
                    {rates.filter(r => !r.isActive).length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rates List */}
        <Card>
          <CardHeader>
            <CardTitle>نرخهای شما</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">در حال بارگذاری...</div>
            ) : rates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>هنوز نرخی تعریف نکرده‌اید</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsDialogOpen(true)}
                >
                  اولین نرخ خود را اضافه کنید
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {rates.map((rate) => (
                  <div
                    key={rate.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">
                            {getCurrencyDisplay(rate.fromCurrency)} → {getCurrencyDisplay(rate.toCurrency)}
                          </h3>
                          <Badge variant={rate.isActive ? 'default' : 'secondary'}>
                            {rate.isActive ? 'فعال' : 'غیرفعال'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">نرخ خرید</p>
                            <p className="font-medium persian-numbers">
                              {rate.buyRate.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">نرخ فروش</p>
                            <p className="font-medium persian-numbers">
                              {rate.sellRate.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          آخرین بروزرسانی: {new Date(rate.updatedAt).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rate.isActive}
                          onCheckedChange={() => handleToggleActive(rate)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(rate)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}