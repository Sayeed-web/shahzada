'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageCircle, Send, X, Building, Phone } from 'lucide-react'
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

interface WorkingSarafChatProps {
  sarafId: string
  sarafName: string
  sarafPhone?: string
  onClose: () => void
}

export function WorkingSarafChat({ sarafId, sarafName, sarafPhone, onClose }: WorkingSarafChatProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (session?.user && sarafId) {
      initChat()
    }
  }, [session, sarafId])

  useEffect(() => {
    if (sessionId && connected) {
      const interval = setInterval(loadMessages, 2000)
      return () => clearInterval(interval)
    }
  }, [sessionId, connected])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const initChat = async () => {
    try {
      const res = await fetch('/api/saraf-chat/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sarafId })
      })
      
      if (res.ok) {
        const data = await res.json()
        setSessionId(data.sessionId)
        setConnected(true)
        loadMessages()
      } else {
        toast.error('خطا در اتصال')
      }
    } catch (error) {
      toast.error('خطا در برقراری ارتباط')
    }
  }

  const loadMessages = async () => {
    if (!sessionId) return
    
    try {
      const res = await fetch(`/api/saraf-chat/messages/${sessionId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const sendMsg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !sessionId || loading) return

    setLoading(true)
    try {
      const res = await fetch('/api/saraf-chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: newMessage.trim()
        })
      })

      if (res.ok) {
        const result = await res.json()
        setMessages(prev => [...prev, result.message])
        setNewMessage('')
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

  if (!session?.user) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[600px] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <Building className="h-5 w-5" />
            <div>
              <h3 className="font-bold">{sarafName}</h3>
              <div className="text-xs opacity-90">
                {connected ? '🟢 متصل' : '🔴 قطع شده'}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {sarafPhone && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.open(`tel:${sarafPhone}`)}
                className="text-white hover:bg-blue-700"
              >
                <Phone className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-blue-700">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.length === 0 && connected && (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>گفتگو را شروع کنید</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderRole === 'SARAF' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  msg.senderRole === 'SARAF'
                    ? 'bg-white text-gray-800 border'
                    : 'bg-blue-600 text-white'
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
                  {msg.senderRole !== 'SARAF' && (
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

        <form onSubmit={sendMsg} className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="پیام خود را بنویسید..."
              disabled={loading || !connected}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={loading || !newMessage.trim() || !connected}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}