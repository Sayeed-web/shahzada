'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Crown, Star, CreditCard, Building, Phone } from 'lucide-react'
import { toast } from 'sonner'

interface PromotionPackage {
  type: 'PREMIUM' | 'FEATURED'
  name: string
  description: string
  features: string[]
  pricing: {
    duration: number
    amount: number
  }[]
}

export default function SarafPromotionsPage() {
  const { data: session } = useSession()
  const [selectedPackage, setSelectedPackage] = useState<PromotionPackage | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number>(30)
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH')
  const [loading, setLoading] = useState(false)

  const promotionPackages: PromotionPackage[] = [
    {
      type: 'PREMIUM',
      name: 'حساب پریمیوم',
      description: 'ارتقاء به حساب پریمیوم با امکانات ویژه',
      features: [
        'نمایش در بالای لیست صرافان',
        'نشان پریمیوم طلایی',
        'اولویت در نتایج جستجو',
        'امکان ثبت نرخهای بیشتر',
        'پشتیبانی اولویتدار',
        'آمار تفصیلی تراکنشها'
      ],
      pricing: [
        { duration: 30, amount: 5000 },
        { duration: 90, amount: 13500 },
        { duration: 180, amount: 24000 },
        { duration: 365, amount: 42000 }
      ]
    },
    {
      type: 'FEATURED',
      name: 'نمایش ویژه',
      description: 'نمایش ویژه در صفحه اصلی',
      features: [
        'نمایش در بخش صرافان ویژه',
        'نشان ستاره آبی',
        'نمایش در اسلایدر اصلی',
        'بازدید بیشتر از پروفایل'
      ],
      pricing: [
        { duration: 7, amount: 1500 },
        { duration: 15, amount: 2800 },
        { duration: 30, amount: 5000 }
      ]
    }
  ]

  const handleSubmitRequest = async () => {
    if (!selectedPackage || !session?.user) {
      toast.error('لطفاً ابتدا یک بسته انتخاب کنید')
      return
    }

    const selectedPrice = selectedPackage.pricing.find(p => p.duration === selectedDuration)
    if (!selectedPrice) {
      toast.error('قیمت انتخاب شده معتبر نیست')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/portal/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedPackage.type,
          duration: selectedDuration,
          amount: selectedPrice.amount,
          paymentMethod
        })
      })

      if (!response.ok) throw new Error('Failed to submit promotion request')

      toast.success('درخواست ارتقاء با موفقیت ثبت شد')
      
      setSelectedPackage(null)
      setSelectedDuration(30)
      setPaymentMethod('CASH')
    } catch (error) {
      toast.error('خطا در ثبت درخواست ارتقاء')
    } finally {
      setLoading(false)
    }
  }

  const getSelectedPrice = () => {
    if (!selectedPackage) return 0
    return selectedPackage.pricing.find(p => p.duration === selectedDuration)?.amount || 0
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <Crown className="h-6 w-6" />
            ارتقاء حساب صرافی
          </h1>
          <p className="text-muted-foreground mt-2">
            حساب خود را ارتقاء دهید و از امکانات ویژه بهرهمند شوید
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promotionPackages.map((pkg) => (
            <Card 
              key={pkg.type}
              className={`cursor-pointer transition-all duration-200 ${
                selectedPackage?.type === pkg.type 
                  ? 'ring-2 ring-primary shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedPackage(pkg)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {pkg.type === 'PREMIUM' ? (
                      <Crown className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <Star className="h-5 w-5 text-blue-500" />
                    )}
                    {pkg.name}
                  </CardTitle>
                  {selectedPackage?.type === pkg.type && (
                    <Badge>انتخاب شده</Badge>
                  )}
                </div>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">امکانات:</h4>
                    <ul className="space-y-1 text-sm">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">قیمتگذاری:</h4>
                    <div className="space-y-1 text-sm">
                      {pkg.pricing.map((price) => (
                        <div key={price.duration} className="flex justify-between">
                          <span>{price.duration} روز</span>
                          <span className="font-medium persian-numbers">
                            {price.amount.toLocaleString()} AFN
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedPackage && (
          <Card>
            <CardHeader>
              <CardTitle>تکمیل سفارش</CardTitle>
              <CardDescription>
                جزئیات سفارش {selectedPackage.name} را تکمیل کنید
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>مدت زمان</Label>
                  <Select 
                    value={selectedDuration.toString()} 
                    onValueChange={(value) => setSelectedDuration(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedPackage.pricing.map((price) => (
                        <SelectItem key={price.duration} value={price.duration.toString()}>
                          {price.duration} روز - {price.amount.toLocaleString()} AFN
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>روش پرداخت</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">پرداخت نقدی</SelectItem>
                      <SelectItem value="BANK_TRANSFER">انتقال بانکی</SelectItem>
                      <SelectItem value="HAWALA">حواله</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Alert>
                <CreditCard className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>راهنمای پرداخت:</strong></p>
                    {paymentMethod === 'CASH' && (
                      <div className="flex items-start gap-2">
                        <Building className="h-4 w-4 mt-0.5" />
                        <div>
                          <p className="font-medium">پرداخت نقدی:</p>
                          <p className="text-sm">مراجعه به دفتر مرکزی سرای شهزاده</p>
                          <p className="text-sm">آدرس: شهر نو، کابل، افغانستان</p>
                        </div>
                      </div>
                    )}
                    {paymentMethod === 'BANK_TRANSFER' && (
                      <div className="flex items-start gap-2">
                        <Building className="h-4 w-4 mt-0.5" />
                        <div>
                          <p className="font-medium">انتقال بانکی:</p>
                          <p className="text-sm">شماره حساب: 1234567890</p>
                          <p className="text-sm">بانک افغانستان - شعبه مرکزی</p>
                        </div>
                      </div>
                    )}
                    {paymentMethod === 'HAWALA' && (
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 mt-0.5" />
                        <div>
                          <p className="font-medium">حواله:</p>
                          <p className="text-sm">تماس با شماره: +93700000001</p>
                          <p className="text-sm">کد حواله پس از تایید ارسال میشود</p>
                        </div>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">خلاصه سفارش:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>بسته:</span>
                    <span>{selectedPackage.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>مدت زمان:</span>
                    <span className="persian-numbers">{selectedDuration} روز</span>
                  </div>
                  <div className="flex justify-between">
                    <span>روش پرداخت:</span>
                    <span>
                      {paymentMethod === 'CASH' ? 'نقدی' :
                       paymentMethod === 'BANK_TRANSFER' ? 'انتقال بانکی' : 'حواله'}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium text-base pt-2 border-t">
                    <span>مجموع:</span>
                    <span className="persian-numbers">
                      {getSelectedPrice().toLocaleString()} AFN
                    </span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSubmitRequest} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'در حال ثبت...' : 'ثبت درخواست ارتقاء'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}