'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  MessageCircle, 
  Send, 
  User, 
  Building, 
  Crown, 
  Phone, 
  Mail, 
  Clock,
  Search,
  Filter,
  MoreVertical,
  Archive,
  Star,
  Paperclip,
  Image,
  FileText,
  Download
} from 'lucide-react'
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
  userEmail?: string
  sarafId?: string
  sarafName?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isActive: boolean
  priority?: 'high' | 'normal' | 'low'
  tags?: string[]
}

export function SarafMessagingCenter() {
  const { data: session } = useSession()
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'active'>('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isSaraf = session?.user?.role === 'SARAF'

  useEffect(() => {
    if (session?.user) {
      fetchChatSessions()
      const interval = setInterval(fetchChatSessions, 3000)
      return () => clearInterval(interval)
    }
  }, [session])

  useEffect(() => {
    if (activeSession) {
      fetchMessages(activeSession.id)
      const interval = setInterval(() => fetchMessages(activeSession.id), 2000)
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
    }
  }

  const fetchMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/saraf-chat/messages/${sessionId}`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      setMessages([])
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

  const filteredSessions = chatSessions.filter(session => {
    const matchesSearch = isSaraf 
      ? session.userName?.toLowerCase().includes(searchTerm.toLowerCase())
      : session.sarafName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'unread' && session.unreadCount > 0) ||
      (filterStatus === 'active' && session.isActive)
    
    return matchesSearch && matchesFilter
  })

  const totalUnread = chatSessions.reduce((sum, session) => sum + session.unreadCount, 0)

  if (!session?.user) return null

  return (
    <div className="h-[700px] flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">
                {isSaraf ? 'مرکز پیامرسانی صرافی' : 'گفتگوهای صرافی'}
              </h2>
              <p className="text-sm opacity-90">
                {isSaraf ? 'مدیریت گفتگوها با مشتریان' : 'ارتباط با صرافان'}
              </p>
            </div>
          </div>
          {totalUnread > 0 && (
            <Badge className="bg-red-500 text-white text-lg px-3 py-1">
              {totalUnread}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/3 border-r flex flex-col">
          {/* Search and Filters */}
          <div className="p-4 border-b bg-gray-50">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={isSaraf ? "جستجو در مشتریان..." : "جستجو در صرافان..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 text-sm"
                />
              </div>
              
              <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="text-xs">همه</TabsTrigger>
                  <TabsTrigger value="unread" className="text-xs">خوانده نشده</TabsTrigger>
                  <TabsTrigger value="active" className="text-xs">فعال</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto">
            {filteredSessions.length > 0 ? (
              <div className="divide-y">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setActiveSession(session)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      activeSession?.id === session.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {isSaraf ? (
                            <User className="h-5 w-5" />
                          ) : (
                            <Building className="h-5 w-5" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {isSaraf ? session.userName : session.sarafName}
                          </h4>
                          {session.unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white text-xs h-5 min-w-[20px]">
                              {session.unreadCount}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-600 truncate mb-1">
                          {session.lastMessage}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {new Date(session.lastMessageTime).toLocaleString('fa-IR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {session.isActive && (
                              <div className="w-2 h-2 bg-green-500 rounded-full" title="آنلاین" />
                            )}
                            {session.priority === 'high' && (
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">هیچ گفتگویی یافت نشد</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeSession ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {isSaraf ? (
                          <User className="h-5 w-5" />
                        ) : (
                          <Building className="h-5 w-5" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-semibold">
                        {isSaraf ? activeSession.userName : activeSession.sarafName}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>آخرین فعالیت: {new Date(activeSession.lastMessageTime).toLocaleString('fa-IR')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isSaraf && activeSession.userEmail && (
                      <Button variant="ghost" size="sm" title="ایمیل">
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" title="بیشتر">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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
                      className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${
                        (isSaraf && message.senderRole === 'SARAF') || 
                        (!isSaraf && message.senderRole !== 'SARAF')
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-800 rounded-bl-sm border'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium opacity-75">
                          {message.senderName}
                        </span>
                        {message.senderRole === 'SARAF' && (
                          <Crown className="h-3 w-3 text-yellow-400" />
                        )}
                      </div>
                      
                      {message.message && (
                        <p className="mb-2 leading-relaxed">{message.message}</p>
                      )}
                      
                      {message.fileUrl && (
                        <div className="mt-2 p-2 bg-white/10 rounded-lg border">
                          {message.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <div className="space-y-2">
                              <img 
                                src={message.fileUrl} 
                                alt={message.fileName || 'تصویر'}
                                className="max-w-full h-auto rounded cursor-pointer"
                                onClick={() => window.open(message.fileUrl, '_blank')}
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-xs opacity-75">{message.fileName}</span>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 px-2"
                                  onClick={() => window.open(message.fileUrl, '_blank')}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span className="text-xs">{message.fileName || 'فایل'}</span>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 px-2"
                                onClick={() => window.open(message.fileUrl, '_blank')}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs opacity-75">
                          {new Date(message.timestamp).toLocaleTimeString('fa-IR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {((isSaraf && message.senderRole === 'SARAF') || 
                          (!isSaraf && message.senderRole !== 'SARAF')) && (
                          <span className="text-xs opacity-75">
                            {message.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-white">
                <form onSubmit={sendMessage} className="flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="px-3"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="پیام خود را بنویسید..."
                    disabled={loading}
                    className="flex-1 rounded-full"
                  />
                  
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={loading || !newMessage.trim()}
                    className="rounded-full px-6"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">گفتگویی را انتخاب کنید</h3>
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
      </div>
    </div>
  )
}