'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageSquare, X, Send, Minimize2, Maximize2, Users, Settings, AlertCircle, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { toast } from 'sonner'

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
  isActive: boolean
  updatedAt: string
}

interface QuickMessage {
  id: string
  message: string
  timestamp: string
  senderName: string
  senderRole: string
  sessionId: string
  isRead: boolean
}

export function AdminFloatingChatButton() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeTab, setActiveTab] = useState<'messages' | 'sessions' | 'settings'>('messages')
  const [unreadCount, setUnreadCount] = useState(0)
  const [recentMessages, setRecentMessages] = useState<QuickMessage[]>([])
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([])
  const [quickReply, setQuickReply] = useState('')
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      setLoading(true)
      setError(null)
      
      Promise.all([
        fetchUnreadCount(),
        fetchRecentMessages(),
        fetchActiveSessions()
      ]).finally(() => {
        setLoading(false)
      })
      
      // Poll for updates every 30 seconds to avoid rate limits
      const interval = setInterval(() => {
        fetchUnreadCount()
        fetchRecentMessages()
        if (activeTab === 'sessions') {
          fetchActiveSessions()
        }
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [session, activeTab])

  useEffect(() => {
    scrollToBottom()
  }, [recentMessages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/admin/chat/unread-count')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count || 0)
        setError(null)
      } else if (response.status === 429) {
        console.warn('Rate limit exceeded for unread count, skipping update')
        return // Don't update error state on rate limit
      } else {
        console.error('Unread count API failed:', response.status)
        setUnreadCount(0)
        if (response.status !== 401) {
          setError('خطا در دریافت تعداد پیامهای خوانده نشده')
        }
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
      setUnreadCount(0)
      setError('خطا در اتصال به سرور')
    }
  }

  const fetchRecentMessages = async () => {
    try {
      const response = await fetch('/api/admin/chat/recent-messages?limit=15')
      if (response.ok) {
        const data = await response.json()
        // Only set real messages, filter out any test/seed data
        const realMessages = (data.messages || []).filter((msg: QuickMessage) => 
          msg.senderName && 
          !msg.senderName.includes('تست') && 
          !msg.senderName.includes('test') &&
          !msg.message.includes('تست') &&
          msg.sessionId &&
          msg.id
        )
        setRecentMessages(realMessages)
        setError(null)
      } else if (response.status === 429) {
        console.warn('Rate limit exceeded for recent messages, skipping update')
        return // Don't update error state on rate limit
      } else {
        console.error('API failed with status:', response.status)
        setRecentMessages([])
        if (response.status !== 401) {
          setError('خطا در دریافت پیامها')
        }
      }
    } catch (error) {
      console.error('Failed to fetch recent messages:', error)
      setRecentMessages([])
      setError('خطا در اتصال به سرور')
    }
  }

  const fetchActiveSessions = async () => {
    try {
      const response = await fetch('/api/admin/chat/sessions?status=ACTIVE&limit=8')
      if (response.ok) {
        const data = await response.json()
        // Filter out test/seed sessions
        const realSessions = (data.sessions || []).filter((session: ChatSession) => 
          session.user.name && 
          !session.user.name.includes('تست') && 
          !session.user.name.includes('test') &&
          !session.user.email.includes('test.com') &&
          session.id
        )
        setActiveSessions(realSessions)
        setError(null)
      } else if (response.status === 429) {
        console.warn('Rate limit exceeded for active sessions, skipping update')
        return // Don't update error state on rate limit
      } else {
        console.error('Sessions API failed with status:', response.status)
        setActiveSessions([])
        if (response.status !== 401) {
          setError('خطا در دریافت جلسات')
        }
      }
    } catch (error) {
      console.error('Failed to fetch active sessions:', error)
      setActiveSessions([])
      setError('خطا در اتصال به سرور')
    }
  }

  const sendQuickReply = async () => {
    if (!quickReply.trim() || !selectedSession) return

    try {
      const response = await fetch('/api/admin/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSession,
          message: quickReply.trim()
        })
      })

      if (response.ok) {
        setQuickReply('')
        fetchRecentMessages()
        fetchUnreadCount()
      }
    } catch (error) {
      console.error('Failed to send quick reply:', error)
    }
  }

  const markAsRead = async (sessionId: string) => {
    try {
      await fetch(`/api/admin/chat/sessions/${sessionId}/mark-read`, {
        method: 'POST'
      })
      fetchUnreadCount()
      fetchRecentMessages()
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'الان'
    if (diffInMinutes < 60) return `${diffInMinutes}د`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}س`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}ر`
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      ADMIN: 'bg-red-500',
      SARAF: 'bg-green-500',
      USER: 'bg-blue-500'
    }
    return colors[role as keyof typeof colors] || 'bg-gray-500'
  }

  if (session?.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <div className="relative">
          <Button
            onClick={() => setIsOpen(!isOpen)}
            className="relative w-16 h-16 rounded-full shadow-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 hover:from-indigo-700 hover:via-purple-700 hover:to-blue-800 transition-all duration-300 hover:scale-105 hover:shadow-3xl border-2 border-white/20"
            title="مدیریت پیامها"
          >
            <MessageSquare className="h-7 w-7 text-white drop-shadow-sm" />
            {loading && (
              <Loader2 className="absolute inset-0 h-4 w-4 animate-spin text-white/70" />
            )}
          </Button>
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full min-w-[24px] h-6 flex items-center justify-center text-xs font-bold shadow-lg animate-pulse border-2 border-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
          {error && (
            <div className="absolute -top-1 -left-1 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
              <AlertCircle className="h-3 w-3" />
            </div>
          )}
        </div>
      </div>

      {/* Chat Panel */}
      {isOpen && (
        <div className={`fixed bottom-24 left-6 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl backdrop-blur-sm transition-all duration-300 ${
          isMinimized ? 'w-80 h-16' : 'w-[360px] h-[480px]'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700 text-white rounded-t-xl">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <div>
                <h3 className="font-semibold text-sm">مدیریت پیامها</h3>
              </div>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white text-xs h-5 min-w-[18px]">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Tabs */}
              <div className="flex border-b">
                <Button
                  variant={activeTab === 'messages' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('messages')}
                  className="flex-1 rounded-none h-8 text-xs"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  پیامها
                </Button>
                <Button
                  variant={activeTab === 'sessions' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('sessions')}
                  className="flex-1 rounded-none h-8 text-xs"
                >
                  <Users className="h-3 w-3 mr-1" />
                  جلسات
                </Button>
                <Button
                  variant={activeTab === 'settings' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('settings')}
                  className="flex-1 rounded-none h-8 text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  تنظیمات
                </Button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-hidden" style={{ height: 'calc(480px - 120px)' }}>
                {loading && (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                )}
                
                {!loading && activeTab === 'messages' && (
                  <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto p-2" style={{ maxHeight: 'calc(480px - 180px)' }}>
                      <div className="space-y-2">
                        {recentMessages.length === 0 ? (
                          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                              <MessageSquare className="h-8 w-8" />
                            </div>
                            <h3 className="font-semibold mb-2">هیچ پیامی یافت نشد</h3>
                            <p className="text-sm">پیامهای جدید کاربران اینجا نمایش داده میشوند</p>
                            <Button variant="outline" size="sm" className="mt-4" onClick={fetchRecentMessages}>
                              بروزرسانی
                            </Button>
                          </div>
                        ) : (
                          recentMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`group p-2.5 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                                !message.isRead 
                                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-300 dark:border-blue-600' 
                                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                              }`}
                              onClick={() => {
                                setSelectedSession(message.sessionId)
                                if (!message.isRead) markAsRead(message.sessionId)
                                window.open(`/admin/chat?session=${message.sessionId}`, '_blank')
                              }}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="relative flex-shrink-0">
                                  <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                                    <AvatarFallback className={`text-white text-xs font-bold ${getRoleBadge(message.senderRole)}`}>
                                      {message.senderName.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  {!message.isRead && (
                                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                      <p className="font-semibold text-xs text-gray-900 dark:text-gray-100 truncate">{message.senderName}</p>
                                      <Badge variant="outline" className="text-[10px] h-4 px-1">
                                        {message.senderRole === 'SARAF' ? 'صراف' : 'کاربر'}
                                      </Badge>
                                    </div>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                      {formatTimeAgo(message.timestamp)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                                    {message.message}
                                  </p>
                                  <div className="flex items-center justify-between mt-1.5">
                                    {!message.isRead && (
                                      <Badge className="bg-red-500 text-white text-[10px] h-4 px-1.5 animate-pulse">
                                        جدید
                                      </Badge>
                                    )}
                                    <span className="text-[10px] text-gray-400 group-hover:text-blue-600 transition-colors">
                                      کلیک برای باز کردن
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    {/* Quick Reply */}
                    {selectedSession && (
                      <div className="p-3 border-t">
                        <div className="flex gap-2">
                          <Input
                            value={quickReply}
                            onChange={(e) => setQuickReply(e.target.value)}
                            placeholder="پاسخ سریع..."
                            className="text-sm"
                            onKeyPress={(e) => e.key === 'Enter' && sendQuickReply()}
                          />
                          <Button size="sm" onClick={sendQuickReply} disabled={!quickReply.trim()}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!loading && activeTab === 'sessions' && (
                  <div className="h-full overflow-y-auto p-3" style={{ maxHeight: 'calc(480px - 120px)' }}>
                    <div className="space-y-2">
                      {activeSessions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>هیچ جلسه فعالی یافت نشد</p>
                          <p className="text-xs mt-1">جلسات فعال اینجا نمایش داده میشوند</p>
                        </div>
                      ) : (
                        activeSessions.map((session) => (
                          <div
                            key={session.id}
                            className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                            onClick={() => window.open(`/admin/chat?session=${session.id}`, '_blank')}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {session.user.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{session.user.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {session.user.role === 'SARAF' ? 'صراف' : 
                                   session.user.role === 'USER' ? 'کاربر' : session.user.role}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {session.messages.length > 0 ? 
                                    `آخرین پیام: ${formatTimeAgo(session.updatedAt)}` : 
                                    'بدون پیام'
                                  }
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <div className={`w-2 h-2 rounded-full ${session.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                {session.messages.filter(m => !m.isRead && m.senderRole !== 'ADMIN').length > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {session.messages.filter(m => !m.isRead && m.senderRole !== 'ADMIN').length}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {!loading && activeTab === 'settings' && (
                  <div className="p-4 space-y-4">
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        دسترسی سریع
                      </div>
                      <Button variant="outline" size="sm" className="w-full justify-start hover:bg-blue-50" asChild>
                        <Link href="/admin/chat">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          مدیریت کامل چت
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start hover:bg-green-50" asChild>
                        <Link href="/admin">
                          <Settings className="h-4 w-4 mr-2" />
                          پنل مدیریت
                        </Link>
                      </Button>
                      
                      <div className="border-t pt-3 mt-4">
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          ابزارهای سیستم
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start text-orange-600 border-orange-200 hover:bg-orange-50"
                          onClick={async () => {
                            if (confirm('آیا مطمئن هستید که میخواهید دادههای تست را پاک کنید؟')) {
                              try {
                                const response = await fetch('/api/admin/clear-seed-data', { method: 'POST' })
                                if (response.ok) {
                                  const data = await response.json()
                                  toast.success(`دادههای تست پاک شد: ${data.results.messages} پیام, ${data.results.sessions} جلسه`)
                                  fetchRecentMessages()
                                  fetchActiveSessions()
                                  fetchUnreadCount()
                                } else {
                                  toast.error('خطا در پاک کردن دادهها')
                                }
                              } catch (error) {
                                toast.error('خطا در اتصال به سرور')
                              }
                            }
                          }}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          پاک کردن دادههای تست
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start mt-2 hover:bg-blue-50"
                          onClick={() => {
                            fetchUnreadCount()
                            fetchRecentMessages()
                            fetchActiveSessions()
                            toast.success('دادهها بروزرسانی شد')
                          }}
                        >
                          <Loader2 className="h-4 w-4 mr-2" />
                          بروزرسانی دادهها
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}