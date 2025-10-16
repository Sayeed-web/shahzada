'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TrackingSystem } from '@/components/hawala/TrackingSystem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard, Search, Plus, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

interface HawalaStats {
  total: number
  pending: number
  completed: number
  cancelled: number
}

export default function HawalaPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<HawalaStats>({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0
  })
  const [trackingCode, setTrackingCode] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHawalaStats()
  }, [])

  const fetchHawalaStats = async () => {
    try {
      const response = await fetch('/api/hawala/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch hawala stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickTrack = () => {
    if (trackingCode.trim()) {
      // Scroll to tracking system and set the code
      const trackingElement = document.getElementById('tracking-system')
      if (trackingElement) {
        trackingElement.scrollIntoView({ behavior: 'smooth' })
        // Pass the tracking code to the TrackingSystem component
        const event = new CustomEvent('setTrackingCode', { detail: trackingCode })
        window.dispatchEvent(event)
      }
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">حواله</h1>
            <p className="text-muted-foreground">
              سیستم مدیریت و پیگیری حوالههای مالی
            </p>
          </div>
          {session?.user?.role === 'SARAF' && (
            <Link href="/portal/hawala/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                حواله جدید
              </Button>
            </Link>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">کل حوالهها</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.total.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                تعداد کل تراکنشهای حواله
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">در انتظار</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.pending.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                نیاز به بررسی و تایید
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تکمیل شده</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.completed.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                تراکنشهای موفق
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">لغو شده</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.cancelled.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                تراکنشهای لغو شده
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Track */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              پیگیری سریع حواله
            </CardTitle>
            <CardDescription>
              کد پیگیری حواله خود را وارد کنید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="trackingCode">کد پیگیری</Label>
                <Input
                  id="trackingCode"
                  placeholder="مثال: HW-2024-001234"
                  className="mt-1"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickTrack()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleQuickTrack} disabled={!trackingCode.trim()}>
                  <Search className="mr-2 h-4 w-4" />
                  پیگیری
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tracking System */}
        <div id="tracking-system">
          <TrackingSystem />
        </div>
      </div>
    </DashboardLayout>
  )
}