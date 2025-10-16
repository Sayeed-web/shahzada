'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Building, Phone, MapPin, Mail, User, Save } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface SarafProfile {
  id: string
  businessName: string
  businessPhone: string
  businessAddress: string
  businessLicense: string
  status: string
  rating: number
  isPremium: boolean
  premiumExpiresAt?: string
  user: {
    name: string
    email: string
  }
}

export default function SarafProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<SarafProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    businessName: '',
    businessPhone: '',
    businessAddress: '',
    businessLicense: ''
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

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/portal/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFormData({
          businessName: data.businessName || '',
          businessPhone: data.businessPhone || '',
          businessAddress: data.businessAddress || '',
          businessLicense: data.businessLicense || ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      toast.error('خطا در بارگذاری پروفایل')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.role === 'SARAF') {
      fetchProfile()
    }
  }, [session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/portal/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('پروفایل بروزرسانی شد')
        fetchProfile()
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('خطا در بروزرسانی پروفایل')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">تایید شده</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">در انتظار تایید</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">رد شده</Badge>
      case 'SUSPENDED':
        return <Badge className="bg-gray-100 text-gray-800">تعلیق شده</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (status === 'loading' || loading) {
    return <div>در حال بارگذاری...</div>
  }

  if (!session || session.user.role !== 'SARAF') {
    return <div>دسترسی غیرمجاز</div>
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/portal">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">پروفایل صرافی</h1>
            <p className="text-muted-foreground">مدیریت اطلاعات کسب و کار شما</p>
          </div>
        </div>

        {profile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  وضعیت حساب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>وضعیت:</span>
                  {getStatusBadge(profile.status)}
                </div>
                
                <div className="flex items-center justify-between">
                  <span>امتیاز:</span>
                  <Badge variant="outline">{profile.rating.toFixed(1)}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>نوع حساب:</span>
                  <Badge variant={profile.isPremium ? 'default' : 'secondary'}>
                    {profile.isPremium ? 'پریمیوم' : 'عادی'}
                  </Badge>
                </div>

                {profile.isPremium && profile.premiumExpiresAt && (
                  <div className="text-sm text-muted-foreground">
                    انقضاء پریمیوم: {new Date(profile.premiumExpiresAt).toLocaleDateString('fa-IR')}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>اطلاعات کسب و کار</CardTitle>
                <CardDescription>
                  اطلاعات صرافی خود را بروزرسانی کنید
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="businessName">نام کسب و کار *</Label>
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="businessPhone">تلفن کسب و کار *</Label>
                      <Input
                        id="businessPhone"
                        value={formData.businessPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, businessPhone: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="businessAddress">آدرس کسب و کار *</Label>
                    <Textarea
                      id="businessAddress"
                      value={formData.businessAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessAddress: e.target.value }))}
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="businessLicense">شماره مجوز کسب و کار</Label>
                    <Input
                      id="businessLicense"
                      value={formData.businessLicense}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessLicense: e.target.value }))}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              اطلاعات حساب کاربری
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">نام کاربری</Label>
                <p className="font-medium">{session.user.name}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">ایمیل</Label>
                <p className="font-medium">{session.user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {profile?.status === 'PENDING' && (
          <Alert>
            <AlertDescription>
              حساب شما در انتظار تایید مدیریت است. پس از تایید میتوانید از تمام امکانات استفاده کنید.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </DashboardLayout>
  )
}