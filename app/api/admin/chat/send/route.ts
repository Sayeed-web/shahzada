import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, message, fileUrl } = await request.json()

    if (!sessionId || (!message?.trim() && !fileUrl)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    try {
      // Verify session exists
      const chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      if (!chatSession) {
        return NextResponse.json({ error: 'Chat session not found' }, { status: 404 })
      }

      // Create the admin message
      const chatMessage = await prisma.chatMessage.create({
        data: {
          sessionId,
          senderId: session.user.id,
          senderName: session.user.name || 'مدیر سیستم',
          senderRole: 'ADMIN',
          message: message?.trim() || '',
          fileUrl: fileUrl || null,
          timestamp: new Date(),
          isRead: false
        }
      })

      // Update session timestamp
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() }
      })

      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: chatSession.user.id,
          title: 'پیام جدید از پشتیبانی',
          message: message?.trim() || 'فایل جدید دریافت شد',
          type: 'info',
          action: 'CHAT_MESSAGE',
          resource: 'CHAT',
          resourceId: sessionId
        }
      })

      return NextResponse.json({
        success: true,
        message: chatMessage
      })
    } catch (dbError) {
      console.error('Database error in chat send:', dbError)
      
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          message: 'Unable to send message. Please try again later.'
        },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('Admin chat send error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}