'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Smartphone,
  Save,
  Eye,
  EyeOff
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [showPassword, setShowPassword] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      sms: false,
      priceAlerts: true,
      newsUpdates: false
    },
    privacy: {
      profileVisible: true,
      activityVisible: false,
      dataSharing: false
    },
    preferences: {
      language: 'fa',
      currency: 'AFN',
      timezone: 'Asia/Kabul',
      dateFormat: 'persian'
    }
  })

  useEffect(() => {
    if (session?.user) {
      setProfileData(prev => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || ''
      }))
    }
  }, [session])

  const handleSave = async () => {
    try {
      // Validate password change if requested
      if (profileData.newPassword) {
        if (profileData.newPassword !== profileData.confirmPassword) {
          toast.error('رمز عبور جدید و تکرار آن مطابقت ندارند')
          return
        }
        if (profileData.newPassword.length < 6) {
          toast.error('رمز عبور باید حداقل 6 کاراکتر باشد')
          return
        }
      }

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            name: profileData.name,
            phone: profileData.phone,
            currentPassword: profileData.currentPassword || undefined,
            newPassword: profileData.newPassword || undefined
          },
          user: settings,
          system: session?.user?.role === 'ADMIN' ? {
            default_language: settings.preferences.language,
            notifications_enabled: settings.notifications.email.toString()
          } : undefined
        })
      })
      
      if (response.ok) {
        toast.success('تنظیمات با موفقیت ذخیره شد')
        
        // Apply language change immediately
        if (settings.preferences.language) {
          document.documentElement.lang = settings.preferences.language
          document.documentElement.dir = settings.preferences.language === 'en' ? 'ltr' : 'rtl'
          localStorage.setItem('language', settings.preferences.language)
          
          // Trigger language change event
          window.dispatchEvent(new CustomEvent('languageChange', { 
            detail: { language: settings.preferences.language } 
          }))
        }
        
        // Refresh page if admin changed system settings
        if (session?.user?.role === 'ADMIN') {
          setTimeout(() => window.location.reload(), 1000)
        }
      } else {
        toast.error('خطا در ذخیره تنظیمات')
      }
    } catch (error) {
      const sanitizedError = error instanceof Error ? error.message.replace(/[\r\n\t]/g, ' ').slice(0, 200) : 'Unknown error'
      console.error('Settings save error:', sanitizedError)
      toast.error('خطا در ذخیره تنظیمات')
    }
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }))
  }

  const handlePrivacyChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }))
  }

  const handlePreferenceChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }))
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            تنظیمات
          </h1>
          <p className="text-lg text-muted-foreground">
            مدیریت تنظیمات حساب کاربری و ترجیحات شما
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  اطلاعات حساب کاربری
                </CardTitle>
                <CardDescription>
                  مدیریت اطلاعات شخصی و حساب کاربری
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">نام کامل</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="نام و نام خانوادگی"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">ایمیل</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="example@email.com"
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">شماره تلفن</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+93700000000"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="current-password">رمز عبور فعلی</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPassword ? 'text' : 'password'}
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="رمز عبور فعلی"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">رمز عبور جدید</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={profileData.newPassword}
                      onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="رمز عبور جدید"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">تکرار رمز عبور</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={profileData.confirmPassword}
                      onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="تکرار رمز عبور جدید"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  اعلان‌ها
                </CardTitle>
                <CardDescription>
                  تنظیم نحوه دریافت اعلان‌ها و هشدارها
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>اعلان‌های ایمیل</Label>
                    <p className="text-sm text-muted-foreground">دریافت اعلان‌ها از طریق ایمیل</p>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={(value) => handleNotificationChange('email', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>اعلان‌های پوش</Label>
                    <p className="text-sm text-muted-foreground">اعلان‌های فوری در مرورگر</p>
                  </div>
                  <Switch
                    checked={settings.notifications.push}
                    onCheckedChange={(value) => handleNotificationChange('push', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>پیامک</Label>
                    <p className="text-sm text-muted-foreground">دریافت پیامک برای تراکنش‌های مهم</p>
                  </div>
                  <Switch
                    checked={settings.notifications.sms}
                    onCheckedChange={(value) => handleNotificationChange('sms', value)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>هشدار قیمت</Label>
                    <p className="text-sm text-muted-foreground">اعلان تغییرات مهم قیمت</p>
                  </div>
                  <Switch
                    checked={settings.notifications.priceAlerts}
                    onCheckedChange={(value) => handleNotificationChange('priceAlerts', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>اخبار و بروزرسانی‌ها</Label>
                    <p className="text-sm text-muted-foreground">اخبار مهم بازار و پلتفورم</p>
                  </div>
                  <Switch
                    checked={settings.notifications.newsUpdates}
                    onCheckedChange={(value) => handleNotificationChange('newsUpdates', value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  حریم خصوصی
                </CardTitle>
                <CardDescription>
                  کنترل نمایش اطلاعات و فعالیت‌های شما
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>نمایش پروفایل</Label>
                    <p className="text-sm text-muted-foreground">نمایش پروفایل برای سایر کاربران</p>
                  </div>
                  <Switch
                    checked={settings.privacy.profileVisible}
                    onCheckedChange={(value) => handlePrivacyChange('profileVisible', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>نمایش فعالیت</Label>
                    <p className="text-sm text-muted-foreground">نمایش فعالیت‌های اخیر</p>
                  </div>
                  <Switch
                    checked={settings.privacy.activityVisible}
                    onCheckedChange={(value) => handlePrivacyChange('activityVisible', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>اشتراک‌گذاری داده</Label>
                    <p className="text-sm text-muted-foreground">اشتراک داده‌ها برای بهبود خدمات</p>
                  </div>
                  <Switch
                    checked={settings.privacy.dataSharing}
                    onCheckedChange={(value) => handlePrivacyChange('dataSharing', value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preferences Sidebar */}
          <div className="space-y-6">
            {/* Theme */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  ظاهر
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>تم</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">روشن</SelectItem>
                      <SelectItem value="dark">تیره</SelectItem>
                      <SelectItem value="system">سیستم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Language & Region */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  زبان و منطقه
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>زبان</Label>
                  <Select 
                    value={settings.preferences.language} 
                    onValueChange={(value) => handlePreferenceChange('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fa">فارسی</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ps">پښتو</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ارز پیش‌فرض</Label>
                  <Select 
                    value={settings.preferences.currency} 
                    onValueChange={(value) => handlePreferenceChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AFN">افغانی (؋)</SelectItem>
                      <SelectItem value="USD">دالر ($)</SelectItem>
                      <SelectItem value="EUR">یورو (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>منطقه زمانی</Label>
                  <Select 
                    value={settings.preferences.timezone} 
                    onValueChange={(value) => handlePreferenceChange('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kabul">کابل</SelectItem>
                      <SelectItem value="Asia/Tehran">تهران</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle>وضعیت حساب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">نوع حساب</span>
                  <Badge variant={session?.user?.role === 'ADMIN' ? 'destructive' : 'default'}>
                    {session?.user?.role === 'ADMIN' ? 'مدیر' : 
                     session?.user?.role === 'SARAF' ? 'صراف' : 'کاربر'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">وضعیت تایید</span>
                  <Badge variant="default">تایید شده</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">عضویت از</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString('fa-AF')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Mobile App */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  اپلیکیشن موبایل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  اپلیکیشن موبایل سرای شهزاده را دانلود کنید
                </p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    دانلود برای اندروید
                  </Button>
                  <Button variant="outline" className="w-full">
                    دانلود برای iOS
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-center">
          <Button onClick={handleSave} size="lg" className="px-8">
            <Save className="h-4 w-4 mr-2" />
            ذخیره تنظیمات
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}