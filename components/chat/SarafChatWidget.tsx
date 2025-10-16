'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, X, Building, Paperclip, Phone } from 'lucide-react'
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

interface SarafChatWidgetProps {
  sarafId: string
  sarafName: string
  sarafPhone?: string
  onClose?: () => void
}

export function SarafChatWidget({ sarafId, sarafName, sarafPhone, onClose }: SarafChatWidgetProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (session?.user && sarafId) {
      initializeChat()
      const interval = setInterval(fetchMessages, 3000)
      return () => clearInterval(interval)
    }
  }, [session, sarafId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeChat = async () => {
    setLoadingMessages(true)
    try {
      const response = await fetch('/api/saraf-chat/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sarafId })
      })
      
      if (!response.ok) throw new Error('Failed to initialize chat')
      
      const data = await response.json()
      setSessionId(data.sessionId)
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to initialize saraf chat:', error)
      toast.error('خطا در اتصال به صراف')
    } finally {
      setLoadingMessages(false)
    }
  }

  const fetchMessages = async () => {
    if (!sessionId || loadingMessages) return
    
    try {
      const response = await fetch(`/api/saraf-chat/messages?sessionId=${sessionId}`)
      if (!response.ok) return
      const data = await response.json()
      setMessages(data.messages || [])
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

      const response = await fetch('/api/saraf-chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: newMessage.trim(),
          fileUrl,
          sarafId: sarafId
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

  const handleClose = () => {
    setIsOpen(false)
    onClose?.()
  }

  if (!session?.user || !isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border rounded-lg shadow-xl w-full max-w-md h-[600px] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <Building className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">{sarafName}</h3>
              {sarafPhone && (
                <p className="text-xs opacity-90">{sarafPhone}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sarafPhone && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.open(`tel:${sarafPhone}`)}
                className="text-white hover:bg-blue-700"
                title="تماس تلفنی"
              >
                <Phone className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="text-white hover:bg-blue-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
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
                  message.senderRole === 'SARAF' ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    message.senderRole === 'SARAF'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {message.senderRole === 'SARAF' && (
                    <p className="text-xs font-medium mb-1 opacity-70">
                      {message.senderName}
                    </p>
                  )}
                  {message.message && <p className="mb-2">{message.message}</p>}
                  {message.fileUrl && (
                    <div className="mt-2 p-2 bg-white/10 rounded border">
                      {message.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img 
                          src={message.fileUrl} 
                          alt={message.fileName || 'تصویر'}
                          className="max-w-full h-auto rounded cursor-pointer"
                          onClick={() => window.open(message.fileUrl, '_blank')}
                        />
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4" />
                            <span className="text-xs">{message.fileName || 'فایل'}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => window.open(message.fileUrl, '_blank')}
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

        <form onSubmit={sendMessage} className="p-3 border-t">
          {selectedFile && (
            <div className="mb-2 p-2 bg-gray-100 rounded flex items-center justify-between">
              <span className="text-sm text-gray-600">{selectedFile.name}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="flex gap-2">
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
    </div>
  )
}
