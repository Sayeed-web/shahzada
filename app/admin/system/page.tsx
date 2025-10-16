'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Settings, Save, RefreshCw, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface SystemConfig {
  key: string
  value: string
  description?: string
  updatedAt: string
}

export default function SystemConfigPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [configs, setConfigs] = useState<SystemConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchConfigs()
    }
  }, [session])

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/admin/system-config')
      if (response.ok) {
        const data = await response.json()
        setConfigs(data)
      }
    } catch (error) {
      console.error('Failed to fetch configs:', error)
      toast.error('خطا در بارگذاری تنظیمات')
    } finally {
      setIsLoading(false)
    }
  }

  const updateConfig = async (key: string, value: string) => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/admin/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      })

      if (response.ok) {
        await fetchConfigs()
        toast.success('تنظیمات بروزرسانی شد')
        
        if (key === 'default_language') {
          document.documentElement.lang = value
          document.documentElement.dir = value === 'en' ? 'ltr' : 'rtl'
        }
        
        if (key === 'maintenance_mode' && value === 'true') {
          toast.warning('حالت تعمیر فعال شد')
        }
      } else {
        toast.error('خطا در بروزرسانی')
      }
    } catch (error) {
      console.error('Config update error:', error)
      toast.error('خطا در بروزرسانی')
    } finally {
      setIsSaving(false)
    }
  }

  const getConfigValue = (key: string) => {
    return configs.find(c => c.key === key)?.value || ''
  }

  const renderConfigInput = (key: string, label: string, type: 'text' | 'number' | 'boolean' | 'select', options?: string[]) => {
    const value = getConfigValue(key)
    
    if (type === 'boolean') {
      return (
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          <Switch
            checked={value === 'true'}
            onCheckedChange={(checked) => updateConfig(key, checked.toString())}
            disabled={isSaving}
          />
        </div>
      )
    }

    if (type === 'select' && options) {
      return (
        <div className="space-y-2">
          <Label>{label}</Label>
          <Select value={value} onValueChange={(newValue) => updateConfig(key, newValue)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <Input
            type={type}
            value={value}
            onChange={(e) => {
              setConfigs(prev => prev.map(c => 
                c.key === key ? { ...c, value: e.target.value } : c
              ))
            }}
            onBlur={(e) => {
              if (e.target.value !== value) {
                updateConfig(key, e.target.value)
              }
            }}
            disabled={isSaving}
          />
        </div>
      </div>
    )
  }

  if (status === 'loading' || !session) {
    return <div>در حال بارگذاری...</div>
  }

  if (session.user.role !== 'ADMIN') {
    return <div>دسترسی غیرمجاز</div>
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            تنظیمات سیستم
          </h1>
          <p className="text-lg text-muted-foreground">
            مدیریت تنظیمات کلی سیستم
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  تنظیمات عمومی
                </CardTitle>
                <CardDescription>
                  تنظیمات اصلی سیستم
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderConfigInput('site_title', 'عنوان سایت', 'text')}
                {renderConfigInput('site_description', 'توضیحات سایت', 'text')}
                {renderConfigInput('saraf_directory_title', 'عنوان بخش صرافان', 'text')}
                {renderConfigInput('default_language', 'زبان پیشفرض', 'select', ['fa', 'en', 'ps'])}
                {renderConfigInput('maintenance_mode', 'حالت تعمیر', 'boolean')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تنظیمات تراکنش</CardTitle>
                <CardDescription>
                  مدیریت محدودیتها و کارمزدها
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderConfigInput('max_transaction_amount', 'حداکثر مبلغ تراکنش (USD)', 'number')}
                {renderConfigInput('default_fee_percentage', 'درصد کارمزد پیشفرض', 'number')}
                {renderConfigInput('currency_update_interval', 'بازه بروزرسانی نرخ (ثانیه)', 'number')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تنظیمات ویژگیها</CardTitle>
                <CardDescription>
                  فعال/غیرفعال کردن ویژگیها
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderConfigInput('notifications_enabled', 'اعلانات فعال', 'boolean')}
                {renderConfigInput('registration_enabled', 'ثبت نام کاربران', 'boolean')}
                {renderConfigInput('saraf_approval_required', 'تایید صرافان الزامی', 'boolean')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>وضعیت سیستم</CardTitle>
                <CardDescription>
                  نمایش وضعیت فعلی سیستم
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>حالت تعمیر</span>
                  <Badge variant={getConfigValue('maintenance_mode') === 'true' ? 'destructive' : 'default'}>
                    {getConfigValue('maintenance_mode') === 'true' ? 'فعال' : 'غیرفعال'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>ثبت نام</span>
                  <Badge variant={getConfigValue('registration_enabled') === 'true' ? 'default' : 'secondary'}>
                    {getConfigValue('registration_enabled') === 'true' ? 'فعال' : 'غیرفعال'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>اعلانات</span>
                  <Badge variant={getConfigValue('notifications_enabled') === 'true' ? 'default' : 'secondary'}>
                    {getConfigValue('notifications_enabled') === 'true' ? 'فعال' : 'غیرفعال'}
                  </Badge>
                </div>

                {getConfigValue('maintenance_mode') === 'true' && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800 dark:text-yellow-200">
                      سیستم در حالت تعمیر قرار دارد
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-center gap-4">
          <Button onClick={fetchConfigs} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}