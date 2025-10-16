'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, User, Building, DollarSign, Settings, Star } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'

interface ActivityItem {
  id: string
  action: string
  resource: string
  details: string
  createdAt: string
  user?: {
    name: string
  }
}

export function RecentActivityCard() {
  const { t } = useLanguage()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentActivity()
  }, [])

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/admin/activity')
      if (!response.ok) throw new Error('Failed to fetch activity')
      const data = await response.json()
      setActivities(data)
    } catch (error) {
      console.error('Failed to fetch recent activity:', error)
      // Set empty activities instead of fake data
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'SARAF_APPROVED':
      case 'SARAF_CREATED':
        return <Building className="h-4 w-4" />
      case 'TRANSACTION_CREATED':
      case 'TRANSACTION_COMPLETED':
        return <DollarSign className="h-4 w-4" />
      case 'USER_REGISTERED':
      case 'USER_UPDATED':
        return <User className="h-4 w-4" />
      case 'PROMOTION_APPROVED':
        return <Star className="h-4 w-4" />
      case 'SYSTEM_CONFIG_UPDATED':
        return <Settings className="h-4 w-4" />
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-400" />
    }
  }

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'SARAF_APPROVED':
      case 'TRANSACTION_COMPLETED':
      case 'PROMOTION_APPROVED':
        return 'bg-green-500'
      case 'TRANSACTION_CREATED':
      case 'RATE_UPDATED':
        return 'bg-blue-500'
      case 'USER_REGISTERED':
        return 'bg-purple-500'
      case 'SYSTEM_CONFIG_UPDATED':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'همین الان'
    if (diffInMinutes < 60) return `${diffInMinutes} دقیقه پیش`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} ساعت پیش`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} روز پیش`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('recentActivity')}</CardTitle>
            <CardDescription>آخرین فعالیتهای سیستم</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecentActivity}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`w-8 h-8 rounded-full ${getActivityColor(activity.action)} flex items-center justify-center text-white`}>
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.details}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.createdAt)}
                    </p>
                    {activity.user && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground">
                          {activity.user.name}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.resource}
                </Badge>
              </div>
            ))}
            
            {activities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>فعالیت اخیری یافت نشد</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}