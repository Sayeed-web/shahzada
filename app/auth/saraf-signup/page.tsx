'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Building, User } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function SarafSignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessAddress: '',
    businessPhone: '',
    businessCity: '',
    licenseNumber: '',
    acceptTerms: false
  })

  const cities = ['کابل', 'هرات', 'مزار شریف', 'قندهار', 'جلال آباد', 'غزنی', 'بامیان']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('رمز عبور و تکرار آن یکسان نیست')
      return
    }
    
    if (!formData.acceptTerms) {
      toast.error('پذیرش قوانین الزامی است')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/saraf-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('ثبت نام موفق! درخواست شما در انتظار بررسی است')
        router.push('/auth/signin')
      } else {
        const data = await response.json()
        toast.error(data.error || 'خطا در ثبت نام')
      }
    } catch (error) {
      toast.error('خطا در ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">ثبت نام صرافی</CardTitle>
          <CardDescription>برای عضویت در شبکه صرافان معتبر فرم زیر را تکمیل کنید</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">اطلاعات شخصی</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">نام و نام خانوادگی</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">ایمیل</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">شماره تلفن</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">رمز عبور</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="confirmPassword">تکرار رمز عبور</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Building className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">اطلاعات صرافی</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">نام صرافی</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="businessPhone">تلفن صرافی</Label>
                  <Input
                    id="businessPhone"
                    value={formData.businessPhone}
                    onChange={(e) => setFormData({...formData, businessPhone: e.target.value})}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="businessAddress">آدرس صرافی</Label>
                  <Textarea
                    id="businessAddress"
                    value={formData.businessAddress}
                    onChange={(e) => setFormData({...formData, businessAddress: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="businessCity">شهر</Label>
                  <Select value={formData.businessCity} onValueChange={(value) => setFormData({...formData, businessCity: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="شهر را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="licenseNumber">شماره جواز کسب</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="acceptTerms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => setFormData({...formData, acceptTerms: !!checked})}
              />
              <Label htmlFor="acceptTerms" className="text-sm">
                قوانین و مقررات را میپذیرم
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'در حال ثبت نام...' : 'ثبت نام صرافی'}
            </Button>
            
            <div className="text-center text-sm">
              قبلاً ثبت نام کردهاید؟{' '}
              <Link href="/auth/signin" className="text-primary hover:underline">
                ورود
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}