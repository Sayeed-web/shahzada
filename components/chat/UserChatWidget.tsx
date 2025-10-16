'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, X, Headphones, Paperclip, Image } from 'lucide-react'
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

export function UserChatWidget() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (session?.user && isOpen) {
      initializeChat()
      const interval = setInterval(fetchMessages, 3000)
      return () => clearInterval(interval)
    }
  }, [session, isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeChat = async () => {
    setLoadingMessages(true)
    try {
      const response = await fetch('/api/chat/initialize', {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to initialize chat')
      const data = await response.json()
      setSessionId(data.sessionId)
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Chat initialization error:', error)
      toast.error('خطا در اتصال به سیستم پشتیبانی')
    } finally {
      setLoadingMessages(false)
    }
  }

  const fetchMessages = async () => {
    if (!sessionId || loadingMessages) return
    
    try {
      const response = await fetch(`/api/chat/messages?sessionId=${sessionId}`)
      if (!response.ok) return
      const data = await response.json()
      setMessages(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedFile) || !sessionId || loading) return

    setLoading(true)
    let fileUrl = null

    try {
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

      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: newMessage.trim(),
          fileUrl
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const result = await response.json()
      setMessages(prev => [...prev, result.message])
      setNewMessage('')
      setSelectedFile(null)
      toast.success('پیام ارسال شد')
      
    } catch (error) {
      toast.error('خطا در ارسال پیام')
    } finally {
      setLoading(false)
    }
  }

  if (!session?.user) return null

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 group">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-white px-0 rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 relative hover:scale-110 transition-all duration-200"
          title="چت با مدیریت"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v3c0 .6.4 1 1 1h.5c.2 0 .5-.1.7-.3L16.5 18H20c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 14H6v-2h2v2zm0-3H6V9h2v2zm0-3H6V6h2v2zm7 6h-5v-2h5v2zm3-3h-8V9h8v2zm0-3h-8V6h8v2z"/>
            </svg>
          )}
          <div className="absolute -top-12 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            چت با مدیریت
          </div>
        </Button>
      </div>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-[400px] bg-background dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-blue-600 dark:bg-blue-700 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              <h3 className="font-semibold">پشتیبانی آنلاین</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-white hover:bg-blue-700 dark:hover:bg-blue-800">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white dark:bg-gray-800">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">بارگذاری پیامها...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">پیامی وجود ندارد. پیام خود را ارسال کنید.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderRole === 'ADMIN' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      message.senderRole === 'ADMIN'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                        : 'bg-blue-600 dark:bg-blue-700 text-white'
                    }`}
                  >
                    {message.senderRole === 'ADMIN' && (
                      <p className="text-xs font-medium mb-1 opacity-70">
                        {message.senderName}
                      </p>
                    )}
                    {message.message && <p className="mb-2">{message.message}</p>}
                    {message.fileUrl && (
                      <div className="mt-2 p-2 bg-white/10 rounded border">
                        {message.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <div className="relative group">
                            <img 
                              src={message.fileUrl} 
                              alt={message.fileName || 'تصویر'}
                              className="max-w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(message.fileUrl, '_blank')}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Paperclip className="h-4 w-4" />
                              <span className="text-xs">{message.fileName || 'فایل'}</span>
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                const link = document.createElement('a')
                                link.href = message.fileUrl!
                                link.download = message.fileName || 'file'
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                              }}
                              className="text-xs px-2 py-1 h-auto"
                            >
                              دانلود
                            </Button>
                          </div>
                        )}
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
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
            {selectedFile && (
              <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">{selectedFile.name}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </div>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="پیام خود را بنویسید..."
                disabled={loading}
                className="text-sm flex-1"
              />
              <Button type="submit" size="sm" disabled={loading || (!newMessage.trim() && !selectedFile)}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
