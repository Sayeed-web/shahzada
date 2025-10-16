'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CitySearchFixed as CitySearch } from '@/components/ui/city-search-fixed'
import { ArrowLeft, Send, Calculator } from 'lucide-react'
import Link from 'next/link'

interface HawalaForm {
  senderName: string
  senderPhone: string
  senderCity: string
  senderCountry: string
  receiverName: string
  receiverPhone: string
  receiverCity: string
  receiverCountry: string
  fromCurrency: string
  toCurrency: string
  fromAmount: number
  rate: number
  fee: number
  notes: string
}

export default function NewHawalaPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [form, setForm] = useState<HawalaForm>({
    senderName: '',
    senderPhone: '',
    senderCity: 'Kabul',
    senderCountry: 'Afghanistan',
    receiverName: '',
    receiverPhone: '',
    receiverCity: '',
    receiverCountry: 'Afghanistan',
    fromCurrency: 'USD',
    toCurrency: 'AFN',
    fromAmount: 0,
    rate: 70.5,
    fee: 0,
    notes: ''
  })

  const currencies = [
    { code: 'USD', name: 'دلار آمریکا' },
    { code: 'EUR', name: 'یورو' },
    { code: 'AFN', name: 'افغانی' },
    { code: 'PKR', name: 'روپیه پاکستان' },
    { code: 'IRR', name: 'ریال ایران' }
  ]

  // Cities are now handled by the CitySearch component with world cities database

  const calculateToAmount = () => {
    return form.fromAmount * form.rate
  }

  const calculateTotal = () => {
    return calculateToAmount() - form.fee
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/portal/hawala/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create hawala')
      }

      setSuccess(`حواله با موفقیت ایجاد شد. کد پیگیری: ${data.transaction.referenceCode}`)
      
      // Reset form
      setForm({
        senderName: '',
        senderPhone: '',
        senderCity: 'Kabul',
        senderCountry: 'Afghanistan',
        receiverName: '',
        receiverPhone: '',
        receiverCity: '',
        receiverCountry: 'Afghanistan',
        fromCurrency: 'USD',
        toCurrency: 'AFN',
        fromAmount: 0,
        rate: 70.5,
        fee: 0,
        notes: ''
      })

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/portal/hawala')
      }, 3000)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'خطا در ایجاد حواله')
    } finally {
      setLoading(false)
    }
  }

  const updateForm = (field: keyof HawalaForm, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/portal/hawala">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              بازگشت
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">حواله جدید</h1>
            <p className="text-muted-foreground">ایجاد تراکنش حواله جدید</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sender Information */}
            <Card>
              <CardHeader>
                <CardTitle>اطلاعات فرستنده</CardTitle>
                <CardDescription>اطلاعات شخص ارسال کننده حواله</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="senderName">نام فرستنده *</Label>
                  <Input
                    id="senderName"
                    value={form.senderName}
                    onChange={(e) => updateForm('senderName', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="senderPhone">شماره تلفن فرستنده *</Label>
                  <Input
                    id="senderPhone"
                    value={form.senderPhone}
                    onChange={(e) => updateForm('senderPhone', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="senderCity">شهر فرستنده</Label>
                  <CitySearch
                    value={form.senderCity}
                    onValueChange={(value) => updateForm('senderCity', value)}
                    placeholder="انتخاب شهر فرستنده"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Receiver Information */}
            <Card>
              <CardHeader>
                <CardTitle>اطلاعات گیرنده</CardTitle>
                <CardDescription>اطلاعات شخص دریافت کننده حواله</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="receiverName">نام گیرنده *</Label>
                  <Input
                    id="receiverName"
                    value={form.receiverName}
                    onChange={(e) => updateForm('receiverName', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="receiverPhone">شماره تلفن گیرنده *</Label>
                  <Input
                    id="receiverPhone"
                    value={form.receiverPhone}
                    onChange={(e) => updateForm('receiverPhone', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="receiverCity">شهر گیرنده *</Label>
                  <CitySearch
                    value={form.receiverCity}
                    onValueChange={(value) => updateForm('receiverCity', value)}
                    placeholder="انتخاب شهر گیرنده"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                جزئیات تراکنش
              </CardTitle>
              <CardDescription>مبلغ، نرخ و محاسبات مالی</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="fromCurrency">ارز مبدا</Label>
                  <Select value={form.fromCurrency} onValueChange={(value) => updateForm('fromCurrency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="toCurrency">ارز مقصد</Label>
                  <Select value={form.toCurrency} onValueChange={(value) => updateForm('toCurrency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="fromAmount">مبلغ ({form.fromCurrency}) *</Label>
                  <Input
                    id="fromAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.fromAmount}
                    onChange={(e) => updateForm('fromAmount', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="rate">نرخ تبدیل *</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.rate}
                    onChange={(e) => updateForm('rate', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="fee">کارمزد ({form.toCurrency})</Label>
                  <Input
                    id="fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.fee}
                    onChange={(e) => updateForm('fee', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label>مبلغ تبدیل شده</Label>
                  <div className="p-2 bg-muted rounded-md">
                    {calculateToAmount().toLocaleString()} {form.toCurrency}
                  </div>
                </div>

                <div>
                  <Label>مبلغ نهایی (پس از کسر کارمزد)</Label>
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md font-medium text-green-800 dark:text-green-200">
                    {calculateTotal().toLocaleString()} {form.toCurrency}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">یادداشت</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => updateForm('notes', e.target.value)}
                  placeholder="یادداشت اضافی در مورد این تراکنش..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/portal/hawala">
              <Button type="button" variant="outline">
                لغو
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                'در حال ایجاد...'
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  ایجاد حواله
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}