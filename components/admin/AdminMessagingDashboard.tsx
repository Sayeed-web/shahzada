'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AdminBroadcastMessage } from './AdminBroadcastMessage'
import { MessageSquare, Clock, User, Reply, Eye } from 'lucide-react'
import Link from 'next/link'

interface ChatSession {
  id: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  messages: Array<{
    id: string
    message: string
    timestamp: string
    senderRole: string
    isRead: boolean
  }>
  _count: {
    messages: number
  }
  isActive: boolean
  updatedAt: string
}

export function AdminMessagingDashboard() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [lastFetch, setLastFetch] = useState(0)
  const [stats, setStats] = useState({
    totalSessions: 0,
    unreadMessages: 0,
    activeSessions: 0,
    pendingResponses: 0
  })

  useEffect(() => {
    fetchRecentSessions()
    fetchMessagingStats()
    
    // Set up periodic refresh every 30 seconds instead of on every render
    const interval = setInterval(() => {
      fetchMessagingStats()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchRecentSessions = async () => {
    try {
      const response = await fetch('/api/admin/chat/sessions?limit=5')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      } else {
        setSessions([])
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  const fetchMessagingStats = async () => {
    const now = Date.now()
    // Debounce: don't fetch if less than 10 seconds since last fetch
    if (now - lastFetch < 10000) {
      return
    }
    
    setLastFetch(now)
    
    try {
      const response = await fetch('/api/admin/chat/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else if (response.status === 429) {
        console.warn('Rate limit exceeded, skipping stats update')
        // Don't reset stats on rate limit, keep existing data
        return
      } else {
        setStats({
          totalSessions: 0,
          unreadMessages: 0,
          activeSessions: 0,
          pendingResponses: 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch messaging stats:', error)
      setStats({
        totalSessions: 0,
        unreadMessages: 0,
        activeSessions: 0,
        pendingResponses: 0
      })
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

  const getRoleBadge = (role: string) => {
    const variants = {
      ADMIN: 'destructive',
      SARAF: 'default',
      USER: 'secondary'
    }
    const labels = {
      ADMIN: 'مدیر',
      SARAF: 'صراف',
      USER: 'کاربر'
    }
    return (
      <Badge variant={variants[role as keyof typeof variants] as any} className="text-xs">
        {labels[role as keyof typeof labels]}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Broadcast Message Button */}
      <div className="flex justify-end">
        <AdminBroadcastMessage />
      </div>
      {/* Messaging Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">کل جلسات</p>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">پیام‌های خوانده نشده</p>
                <p className="text-2xl font-bold text-red-600">{stats.unreadMessages}</p>
              </div>
              <Eye className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">جلسات فعال</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeSessions}</p>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">نیاز به پاسخ</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingResponses}</p>
              </div>
              <Reply className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      <div>
        <h3 className="text-lg font-semibold mb-4">پیام‌های اخیر</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {session.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{session.user.name}</p>
                          {getRoleBadge(session.user.role)}
                          {!session.messages[0]?.isRead && (
                            <Badge variant="destructive" className="text-xs">جدید</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {session.messages[0]?.message || 'بدون پیام'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(session.updatedAt)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            • {session._count.messages} پیام
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/chat?session=${session.id}`}>
                          <Reply className="h-4 w-4 mr-1" />
                          پاسخ
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {sessions.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">پیام جدیدی وجود ندارد</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}