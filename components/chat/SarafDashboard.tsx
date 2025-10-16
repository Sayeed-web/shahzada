'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Send, User, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  id: string
  senderId: string
  senderName: string
  senderRole: string
  message: string
  timestamp: string
  isRead: boolean
}

interface ChatSession {
  id: string
  userId: string
  userName: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isActive: boolean
}

export function SarafDashboard() {
  const { data: session } = useSession()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (session?.user?.role === 'SARAF') {
      loadSessions()
      const interval = setInterval(loadSessions, 5000)
      return () => clearInterval(interval)
    }
  }, [session])

  useEffect(() => {
    if (activeSession) {
      loadMessages(activeSession.id)
      const interval = setInterval(() => loadMessages(activeSession.id), 3000)
      return () => clearInterval(interval)
    }
  }, [activeSession])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/saraf-chat/sessions')
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  const loadMessages = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/saraf-chat/messages/${sessionId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const sendMsg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeSession || loading) return

    setLoading(true)
    try {
      const res = await fetch('/api/saraf-chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.id,
          message: newMessage.trim()
        })
      })

      if (res.ok) {
        const result = await res.json()
        setMessages(prev => [...prev, result.message])
        setNewMessage('')
        loadSessions()
        toast.success('پیام ارسال شد')
      } else {
        toast.error('خطا در ارسال')
      }
    } catch (error) {
      toast.error('خطا در ارسال پیام')
    } finally {
      setLoading(false)
    }
  }

  const totalUnread = sessions.reduce((sum, s) => sum + s.unreadCount, 0)

  if (session?.user?.role !== 'SARAF') {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p>این بخش فقط برای صرافان در دسترس است.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          پیامهای مشتریان
          {totalUnread > 0 && (
            <Badge className="bg-red-500 text-white">{totalUnread}</Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex overflow-hidden p-0">
        <div className="w-1/3 border-r dark:border-gray-700 overflow-y-auto bg-white dark:bg-gray-900">
          <div className="p-4">
            <h4 className="text-sm font-medium mb-3">گفتگوها ({sessions.length})</h4>
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setActiveSession(session)}
                  className={`p-3 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    activeSession?.id === session.id ? 'bg-blue-50 dark:bg-blue-900/30 border-r-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium truncate">{session.userName}</span>
                    {session.unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white text-xs h-5 min-w-[20px]">
                        {session.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-1">{session.lastMessage}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {new Date(session.lastMessageTime).toLocaleString('fa-IR')}
                  </p>
                </div>
              ))}
              
              {sessions.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">هیچ گفتگویی موجود نیست</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {activeSession ? (
            <>
              <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5" />
                  <div>
                    <span className="font-medium">{activeSession.userName}</span>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>آخرین پیام: {new Date(activeSession.lastMessageTime).toLocaleString('fa-IR')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-800">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderRole === 'SARAF' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] p-3 rounded-lg text-sm ${
                        msg.senderRole === 'SARAF'
                          ? 'bg-blue-600 dark:bg-blue-700 text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border dark:border-gray-600'
                      }`}
                    >
                      <p className="mb-1">{msg.message}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString('fa-IR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {msg.senderRole === 'SARAF' && (
                          <span className="text-xs opacity-70">
                            {msg.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMsg} className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="پیام خود را بنویسید..."
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={loading || !newMessage.trim()}>
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">گفتگویی را انتخاب کنید</p>
                <p className="text-sm">برای پاسخ به مشتری، یکی از گفتگوها را انتخاب کنید</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}