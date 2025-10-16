'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { MessageSquare, Send, X, Building, Paperclip, Phone, Star, MapPin, Clock, User, Image, FileText, Download } from 'lucide-react'
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

interface SarafInfo {
  id: string
  businessName: string
  businessPhone?: string
  businessAddress?: string
  rating: number
  isActive: boolean
  isPremium: boolean
}

interface EnhancedSarafChatWidgetProps {
  sarafId: string
  sarafInfo: SarafInfo
  onClose?: () => void
  isMinimized?: boolean
  onMinimize?: () => void
}

export function EnhancedSarafChatWidget({ 
  sarafId, 
  sarafInfo, 
  onClose, 
  isMinimized = false, 
  onMinimize 
}: EnhancedSarafChatWidgetProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (session?.user && sarafId) {
      initializeChat()
      const interval = setInterval(fetchMessages, 2000)
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
    setConnectionStatus('connecting')
    try {
      const response = await fetch('/api/saraf-chat/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sarafId })
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || 'Failed to initialize chat')
      }
      
      const data = await response.json()
      setSessionId(data.sessionId)
      setMessages(data.messages || [])
      setConnectionStatus('connected')
      
    } catch (error) {
      console.error('Failed to initialize saraf chat:', error)
      setConnectionStatus('disconnected')
      toast.error('خطا در برقراری ارتباط')
    }
  }

  const fetchMessages = async () => {
    if (!sessionId) return
    
    try {
      const response = await fetch(`/api/saraf-chat/messages/${sessionId}`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      const data = await response.json()
      setMessages(data.messages || [])
      setConnectionStatus('connected')
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      setConnectionStatus('disconnected')
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
          fileName: selectedFile?.name
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

  const handleTyping = (value: string) => {
    setNewMessage(value)
    
    if (!isTyping) {
      setIsTyping(true)
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 1000)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ))
  }

  if (!session?.user) return null

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-20 z-50">
        <Button
          onClick={onMinimize}
          className="rounded-full w-12 h-12 shadow-lg bg-blue-600 hover:bg-blue-700 relative"
        >
          <Building className="h-5 w-5 text-white" />
          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white min-w-[16px] h-4 text-xs">
            {messages.filter(m => m.senderRole === 'SARAF' && !m.isRead).length}
          </Badge>
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md h-[700px] flex flex-col shadow-2xl">
        {/* Header */}
        <CardHeader className="p-0">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Building className="h-8 w-8 p-1 bg-white/20 rounded-full" />
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                    connectionStatus === 'connected' ? 'bg-green-500' : 
                    connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{sarafInfo.businessName}</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {renderStars(sarafInfo.rating)}
                    </div>
                    <span className="text-xs opacity-90">{sarafInfo.rating.toFixed(1)}</span>
                    {sarafInfo.isPremium && (
                      <Badge className="bg-yellow-500 text-yellow-900 text-xs">ممتاز</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {sarafInfo.businessPhone && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => window.open(`tel:${sarafInfo.businessPhone}`)}
                    className="text-white hover:bg-white/20 p-2"
                    title="تماس تلفنی"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
                {onMinimize && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onMinimize}
                    className="text-white hover:bg-white/20 p-2"
                    title="کوچک کردن"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClose}
                  className="text-white hover:bg-white/20 p-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Saraf Info */}
            <div className="text-xs opacity-90 space-y-1">
              {sarafInfo.businessAddress && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{sarafInfo.businessAddress}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>آنلاین - پاسخگویی سریع</span>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderRole === 'SARAF' ? 'justify-start' : 'justify-end'
              }`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                  message.senderRole === 'SARAF'
                    ? 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    : 'bg-blue-600 text-white rounded-br-sm'
                }`}
              >
                {message.senderRole === 'SARAF' && (
                  <div className="flex items-center gap-2 mb-1">
                    <Building className="h-3 w-3 opacity-70" />
                    <span className="text-xs font-medium opacity-70">
                      {message.senderName}
                    </span>
                  </div>
                )}
                
                {message.message && <p className="mb-2 leading-relaxed">{message.message}</p>}
                
                {message.fileUrl && (
                  <div className="mt-2 p-2 bg-white/10 rounded-lg border">
                    {message.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <div className="relative group">
                        <img 
                          src={message.fileUrl} 
                          alt={message.fileName || 'تصویر'}
                          className="max-w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(message.fileUrl, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => window.open(message.fileUrl, '_blank')}
                            className="text-xs"
                          >
                            <Image className="h-3 w-3 mr-1" />
                            مشاهده
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-xs">{message.fileName || 'فایل'}</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => window.open(message.fileUrl, '_blank')}
                          className="text-xs px-2 py-1 h-auto"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString('fa-IR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {message.senderRole !== 'SARAF' && (
                    <div className="text-xs opacity-70">
                      {message.isRead ? '✓✓' : '✓'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-sm">
                <div className="flex items-center gap-1">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-gray-500 mr-2">در حال تایپ...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="p-4 border-t bg-gray-50">
          {selectedFile && (
            <div className="mb-3 p-2 bg-white rounded-lg border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{selectedFile.name}</span>
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedFile(null)}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          <form onSubmit={sendMessage} className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 text-gray-500 hover:text-blue-600"
              disabled={loading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            
            <Input
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder="پیام خود را بنویسید..."
              disabled={loading}
              className="flex-1 rounded-full border-gray-300 focus:border-blue-500"
            />
            
            <Button 
              type="submit" 
              size="sm" 
              disabled={loading || (!newMessage.trim() && !selectedFile)}
              className="rounded-full px-4 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          
          <div className="text-xs text-gray-500 mt-2 text-center">
            وضعیت اتصال: {
              connectionStatus === 'connected' ? '🟢 متصل' :
              connectionStatus === 'connecting' ? '🟡 در حال اتصال...' : '🔴 قطع شده'
            }
          </div>
        </div>
      </Card>
    </div>
  )
}