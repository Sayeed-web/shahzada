'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MessageSquare, Search, Send, Trash2, Eye, User, Clock, Paperclip, Image, Download } from 'lucide-react'
import { toast } from 'sonner'

interface ChatSession {
  id: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
    isActive: boolean
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
}

interface ChatMessage {
  id: string
  sessionId: string
  senderId: string
  senderName: string
  senderRole: string
  message: string
  fileUrl?: string
  timestamp: string
  isRead: boolean
  sender: {
    id: string
    name: string
    email: string
    role: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function AdminChatPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showChatDialog, setShowChatDialog] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSessions()
  }, [pagination.page, search, statusFilter])

  // Handle URL session parameter
  useEffect(() => {
    const sessionParam = searchParams.get('session')
    if (sessionParam && sessions.length > 0) {
      const targetSession = sessions.find(s => s.id === sessionParam)
      if (targetSession) {
        setSelectedSession(targetSession)
        setShowChatDialog(true)
      }
    }
  }, [searchParams, sessions])

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession.id)
      const interval = setInterval(() => fetchMessages(selectedSession.id), 5000)
      return () => clearInterval(interval)
    }
  }, [selectedSession])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        status: statusFilter
      })

      const response = await fetch(`/api/admin/chat/sessions?${params}`)
      if (!response.ok) throw new Error('Failed to fetch sessions')

      const data = await response.json()
      setSessions(data.sessions || [])
      if (data.pagination) {
        setPagination({
          page: data.pagination.currentPage || 1,
          limit: pagination.limit,
          total: data.pagination.totalCount || 0,
          pages: data.pagination.totalPages || 0
        })
      } else {
        setPagination({
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      setError('خطا در بارگذاری جلسات چت')
      setSessions([])
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (sessionId: string) => {
    setMessagesLoading(true)
    try {
      const response = await fetch(`/api/admin/chat/messages/${sessionId}`)
      if (!response.ok) throw new Error('Failed to fetch messages')

      const data = await response.json()
      setMessages(data)
      setError('')
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      setError('خطا در بارگذاری پیامها')
      setMessages([])
    } finally {
      setMessagesLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedFile) || !selectedSession || sendingMessage) return

    setSendingMessage(true)
    let fileUrl = null

    try {
      // Handle file upload if present
      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        
        try {
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            fileUrl = uploadData.url
          }
        } catch (uploadError) {
          console.warn('File upload failed:', uploadError)
        }
      }

      const response = await fetch('/api/admin/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          message: newMessage.trim(),
          fileUrl
        })
      })

      if (!response.ok) throw new Error('Failed to send message')

      const result = await response.json()
      setMessages(prev => [...prev, result.message])
      setNewMessage('')
      setSelectedFile(null)
      toast.success('پیام ارسال شد')
      
      // Refresh sessions to update last message
      fetchSessions()
    } catch (error) {
      toast.error('خطا در ارسال پیام')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('آیا از حذف این جلسه چت اطمینان دارید؟')) return

    try {
      const response = await fetch(`/api/admin/chat/sessions/${sessionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete session')

      toast.success('جلسه چت حذف شد')
      fetchSessions()
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null)
        setShowChatDialog(false)
      }
    } catch (error) {
      toast.error('خطا در حذف جلسه چت')
    }
  }

  const openChatDialog = (session: ChatSession) => {
    setSelectedSession(session)
    setShowChatDialog(true)
  }

  const getStatusBadge = (isActive: boolean) => (
    <Badge variant={isActive ? 'default' : 'secondary'}>
      {isActive ? 'فعال' : 'غیرفعال'}
    </Badge>
  )

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
      <Badge variant={variants[role as keyof typeof variants] as any}>
        {labels[role as keyof typeof labels]}
      </Badge>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              مدیریت چت و پیامها
            </h1>
            <p className="text-muted-foreground">مشاهده و پاسخ به پیامهای کاربران</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>فیلترها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="جستجو بر اساس نام یا ایمیل کاربر..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">همه جلسات</SelectItem>
                  <SelectItem value="ACTIVE">فعال</SelectItem>
                  <SelectItem value="INACTIVE">غیرفعال</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Chat Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle>جلسات چت ({pagination.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">در حال بارگذاری...</div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>کاربر</TableHead>
                      <TableHead>نقش</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>تعداد پیام</TableHead>
                      <TableHead>آخرین پیام</TableHead>
                      <TableHead>تاریخ ایجاد</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{session.user.name}</div>
                            <div className="text-sm text-muted-foreground">{session.user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(session.user.role)}</TableCell>
                        <TableCell>{getStatusBadge(session.isActive)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{session._count.messages}</Badge>
                        </TableCell>
                        <TableCell>
                          {session.messages[0] ? (
                            <div className="max-w-xs">
                              <div className="text-sm truncate">{session.messages[0].message}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(session.messages[0].timestamp).toLocaleDateString('fa-IR')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">بدون پیام</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(session.createdAt).toLocaleDateString('fa-IR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openChatDialog(session)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteSession(session.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    نمایش {((pagination.page - 1) * pagination.limit) + 1} تا {Math.min(pagination.page * pagination.limit, pagination.total)} از {pagination.total} جلسه
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      قبلی
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      بعدی
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat Dialog */}
      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="max-w-4xl h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              چت با {selectedSession?.user.name}
            </DialogTitle>
            <DialogDescription>
              {selectedSession?.user.email}
            </DialogDescription>
            <div className="mt-2">
              {selectedSession && getRoleBadge(selectedSession.user.role || 'USER')}
            </div>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 border dark:border-gray-700 rounded bg-white dark:bg-gray-900">
              {messagesLoading ? (
                <div className="text-center py-8">در حال بارگذاری پیامها...</div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderRole === 'ADMIN' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg text-sm ${
                        message.senderRole === 'ADMIN'
                          ? 'bg-blue-600 dark:bg-blue-700 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-xs">
                          {message.senderName}
                        </span>
                        {getRoleBadge(message.senderRole)}
                      </div>
                      {message.message && <p className="mb-2">{message.message}</p>}
                      {message.fileUrl && (
                        <div className="mt-2 p-2 bg-white/10 rounded border">
                          {message.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <div className="relative">
                              <img 
                                src={message.fileUrl} 
                                alt="تصویر"
                                className="max-w-full h-auto rounded cursor-pointer"
                                onClick={() => window.open(message.fileUrl, '_blank')}
                              />
                              <Button 
                                size="sm" 
                                variant="secondary"
                                className="absolute top-2 right-2"
                                onClick={() => {
                                  const link = document.createElement('a')
                                  link.href = message.fileUrl!
                                  link.download = 'image'
                                  document.body.appendChild(link)
                                  link.click()
                                  document.body.removeChild(link)
                                }}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Paperclip className="h-4 w-4" />
                                <span className="text-xs">فایل</span>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => {
                                  const link = document.createElement('a')
                                  link.href = message.fileUrl!
                                  link.download = 'file'
                                  document.body.appendChild(link)
                                  link.click()
                                  document.body.removeChild(link)
                                }}
                              >
                                دانلود
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleString('fa-IR')}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Send Message Form */}
            <form onSubmit={handleSendMessage} className="mt-4 space-y-3">
              {selectedFile && (
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    <span className="text-sm">{selectedFile.name}</span>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div>
                <Label htmlFor="message">پیام جدید</Label>
                <Textarea
                  id="message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="پیام خود را بنویسید..."
                  rows={3}
                  disabled={sendingMessage}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sendingMessage}
                  >
                    <Paperclip className="h-4 w-4 mr-1" />
                    ضمیمه فایل
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>
                <Button type="submit" disabled={sendingMessage || (!newMessage.trim() && !selectedFile)}>
                  <Send className="mr-2 h-4 w-4" />
                  {sendingMessage ? 'در حال ارسال...' : 'ارسال پیام'}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}