'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, X, Building } from 'lucide-react'
import { SarafMessagingDashboard } from './SarafMessagingDashboard'

interface ChatSession {
  id: string
  sarafId: string
  sarafName: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isActive: boolean
}

export function UserSarafChatButton() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [totalUnread, setTotalUnread] = useState(0)

  useEffect(() => {
    if (session?.user && session.user.role !== 'ADMIN') {
      fetchChatSessions()
      const interval = setInterval(fetchChatSessions, 10000) // Check every 10 seconds
      return () => clearInterval(interval)
    }
  }, [session])

  const fetchChatSessions = async () => {
    try {
      const response = await fetch('/api/saraf-chat/sessions')
      if (response.ok) {
        const sessions = await response.json()
        setChatSessions(sessions)
        const unreadCount = sessions.reduce((sum: number, session: ChatSession) => sum + session.unreadCount, 0)
        setTotalUnread(unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error)
    }
  }

  // Don't show for admins or if no session
  if (!session?.user || session.user.role === 'ADMIN') {
    return null
  }

  return (
    <>
      <div className="fixed bottom-6 left-6 z-50 group">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-white px-0 rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 relative hover:scale-110 transition-all duration-200"
          title="گفتگو با صرافان"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Building className="h-6 w-6 text-white" />
          )}
          {totalUnread > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white min-w-[20px] h-5 text-xs">
              {totalUnread > 99 ? '99+' : totalUnread}
            </Badge>
          )}
          <div className="absolute -top-12 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            گفتگو با صرافان
          </div>
        </Button>
      </div>

      {isOpen && (
        <div className="fixed bottom-24 left-6 w-96 h-[500px] bg-background border rounded-lg shadow-xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b bg-green-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              <h3 className="font-semibold">گفتگوهای صرافی</h3>
              {totalUnread > 0 && (
                <Badge className="bg-red-500 text-white">
                  {totalUnread}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-white hover:bg-green-700">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-hidden">
            {chatSessions.length > 0 ? (
              <SarafMessagingDashboard />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground p-6">
                <div className="text-center">
                  <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">هیچ گفتگویی موجود نیست</h3>
                  <p className="text-sm">
                    برای شروع گفتگو با صرافی، از صفحه صرافان یکی را انتخاب کنید
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}