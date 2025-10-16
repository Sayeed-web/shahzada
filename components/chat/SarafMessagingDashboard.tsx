'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Send, User, Building, Crown, Phone, Mail } from 'lucide-react'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: string
  message: string
  fileUrl?: string
  fileName?: string
  timestamp: string
  isRead: boolean
}

interface ChatSession {
  id: string
  userId?: string
  userName?: string
  userRole?: string
  sarafId?: string
  sarafName?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isActive: boolean
}

export function SarafMessagingDashboard() {
  const { data: session } = useSession()
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isSaraf = session?.user?.role === 'SARAF'

  useEffect(() => {
    if (session?.user) {
      fetchChatSessions()
      const interval = setInterval(fetchChatSessions, 5000)
      return () => clearInterval(interval)
    }
  }, [session])

  useEffect(() => {
    if (activeSession) {
      fetchMessages(activeSession.id)
      const interval = setInterval(() => fetchMessages(activeSession.id), 3000)
      return () => clearInterval(interval)
    }
  }, [activeSession])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchChatSessions = async () => {
    try {
      const response = await fetch('/api/saraf-chat/sessions')
      if (!response.ok) throw new Error('Failed to fetch chat sessions')
      const data = await response.json()
      setChatSessions(data)
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error)
      // Enhanced fallback data for demo
      setChatSessions([
        {
          id: 'demo-session-1',
          userId: 'user1',
          userName: 'احمد محمدی',
          userRole: 'USER',
          lastMessage: 'سلام، نرخ دلار چقدر است؟',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 1,
          isActive: true
        },
        {
          id: 'demo-session-2',
          userId: 'user2',
          userName: 'فاطمه احمدی',
          userRole: 'USER',
          lastMessage: 'آیا حواله به هرات امکان دارد؟',
          lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
          unreadCount: 0,
          isActive: true
        }
      ])
    }
  }

  const fetchMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/saraf-chat/messages/${sessionId}`)
      if (!response.ok) {
        console.warn('Failed to fetch messages, using fallback')
        setMessages([])
        return
      }
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      // Provide demo messages for selected session
      if (sessionId === 'demo-session-1') {
        setMessages([
          {
            id: 'msg-1',
            senderId: 'user1',
            senderName: 'احمد محمدی',
            senderRole: 'USER',
            message: 'سلام، نرخ دلار چقدر است؟',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            isRead: true
          },
          {
            id: 'msg-2',
            senderId: 'saraf1',
            senderName: 'صرافی شاه زاده',
            senderRole: 'SARAF',
            message: 'سلام علیکم، نرخ خرید دلار ۷۰.۵ و فروش ۷۱.۵ افغانی است',
            timestamp: new Date(Date.now() - 240000).toISOString(),
            isRead: true
          },
          {
            id: 'msg-3',
            senderId: 'user1',
            senderName: 'احمد محمدی',
            senderRole: 'USER',
            message: 'متشکرم، آیا برای حواله به هرات هم همین نرخ است؟',
            timestamp: new Date(Date.now() - 180000).toISOString(),
            isRead: false
          }
        ])
      } else {
        setMessages([])
      }
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeSession || loading) return

    setLoading(true)
    try {
      const response = await fetch('/api/saraf-chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.id,
          message: newMessage.trim()
        })
      })

      if (!response.ok) throw new Error('Failed to send message')

      const result = await response.json()
      setMessages(prev => [...prev, result.message])
      setNewMessage('')
      fetchChatSessions()
      toast.success('پیام ارسال شد')
    } catch (error) {
      toast.error('خطا در ارسال پیام')
    } finally {
      setLoading(false)
    }
  }

  const totalUnread = chatSessions.reduce((sum, session) => sum + session.unreadCount, 0)

  if (!session?.user) return null

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          {isSaraf ? 'پیام‌های مشتریان' : 'گفتگو با صرافان'}
          {totalUnread > 0 && (
            <Badge className="bg-red-500 text-white">
              {totalUnread}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex overflow-hidden p-0">
        {/* Sessions List */}
        <div className="w-1/3 border-r overflow-y-auto">
          <div className="p-4">
            <h4 className="text-sm font-medium mb-3">
              گفتگوها ({chatSessions.length})
            </h4>
            <div className="space-y-2">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setActiveSession(session)}
                  className={`p-3 rounded cursor-pointer hover:bg-muted transition-colors ${
                    activeSession?.id === session.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {isSaraf ? (
                      <>
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium truncate">
                          {session.userName || 'کاربر ناشناس'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Building className="h-4 w-4" />
                        <span className="text-sm font-medium truncate">
                          {session.sarafName || 'صرافی'}
                        </span>
                      </>
                    )}
                    {session.unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white text-xs h-5 min-w-[20px]">
                        {session.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mb-1">
                    {session.lastMessage}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.lastMessageTime).toLocaleString('fa-IR')}
                  </p>
                </div>
              ))}
              
              {chatSessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">هیچ گفتگویی موجود نیست</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeSession ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-muted/30">
                <div className="flex items-center gap-3">
                  {isSaraf ? (
                    <>
                      <User className="h-5 w-5" />
                      <div>
                        <span className="font-medium">{activeSession.userName}</span>
                        <Badge variant="outline" className="text-xs mr-2">
                          {activeSession.userRole === 'USER' ? 'کاربر' : activeSession.userRole}
                        </Badge>
                      </div>
                    </>
                  ) : (
                    <>
                      <Building className="h-5 w-5" />
                      <div>
                        <span className="font-medium">{activeSession.sarafName}</span>
                        <Badge variant="outline" className="text-xs mr-2">
                          صرافی
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      (isSaraf && message.senderRole === 'SARAF') || 
                      (!isSaraf && message.senderRole !== 'SARAF')
                        ? 'justify-end' 
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        (isSaraf && message.senderRole === 'SARAF') || 
                        (!isSaraf && message.senderRole !== 'SARAF')
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium opacity-70">
                          {message.senderName}
                        </span>
                        {message.senderRole === 'SARAF' && (
                          <Crown className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                      {message.message && <p className="mb-2">{message.message}</p>}
                      {message.fileUrl && (
                        <div className="mt-2 p-2 bg-white/10 rounded border">
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{message.fileName || 'فایل'}</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 px-2"
                              onClick={() => window.open(message.fileUrl, '_blank')}
                            >
                              دانلود
                            </Button>
                          </div>
                        </div>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString('fa-IR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="پیام خود را بنویسید..."
                    disabled={loading}
                    className="text-sm"
                  />
                  <Button type="submit" size="sm" disabled={loading || !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">گفتگویی را انتخاب کنید</p>
                <p className="text-sm">
                  {isSaraf 
                    ? 'برای شروع گفتگو با مشتری، یکی از گفتگوها را انتخاب کنید'
                    : 'برای شروع گفتگو با صرافی، یکی از گفتگوها را انتخاب کنید'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}