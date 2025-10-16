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

    const { message, targetRole, targetUsers } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    try {
      // Get target users based on criteria
      let users = []
      
      if (targetUsers && targetUsers.length > 0) {
        // Send to specific users
        users = await prisma.user.findMany({
          where: {
            id: { in: targetUsers },
            isActive: true
          },
          select: { id: true, name: true, email: true }
        })
      } else if (targetRole && targetRole !== 'ALL') {
        // Send to users with specific role
        users = await prisma.user.findMany({
          where: {
            role: targetRole,
            isActive: true
          },
          select: { id: true, name: true, email: true }
        })
      } else {
        // Send to all active users
        users = await prisma.user.findMany({
          where: {
            isActive: true,
            role: { not: 'ADMIN' }
          },
          select: { id: true, name: true, email: true }
        })
      }

      const results = []
      
      for (const user of users) {
        try {
          // Find or create chat session for user
          let chatSession = await prisma.chatSession.findFirst({
            where: {
              userId: user.id,
              isActive: true
            }
          })

          if (!chatSession) {
            chatSession = await prisma.chatSession.create({
              data: {
                userId: user.id,
                isActive: true
              }
            })
          }

          // Send message to user's chat session
          const chatMessage = await prisma.chatMessage.create({
            data: {
              sessionId: chatSession.id,
              senderId: session.user.id,
              senderName: session.user.name || 'مدیر سیستم',
              senderRole: 'ADMIN',
              message: message.trim(),
              timestamp: new Date(),
              isRead: false
            }
          })

          // Create notification for user
          await prisma.notification.create({
            data: {
              userId: user.id,
              title: 'پیام جدید از مدیریت',
              message: message.trim(),
              type: 'info',
              action: 'BROADCAST_MESSAGE',
              resource: 'CHAT',
              resourceId: chatSession.id
            }
          })

          results.push({
            userId: user.id,
            userName: user.name,
            messageId: chatMessage.id,
            success: true
          })
        } catch (userError) {
          results.push({
            userId: user.id,
            userName: user.name,
            success: false,
            error: userError.message
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Broadcast message sent',
        results,
        totalSent: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length
      })

    } catch (dbError) {
      console.error('Database error in broadcast:', dbError)
      
      // Return error instead of mock data
      return NextResponse.json({
        error: 'Database connection failed',
        success: false,
        results: [],
        totalSent: 0,
        totalFailed: 0
      }, { status: 503 })
    }

  } catch (error) {
    console.error('Broadcast message error:', error)
    return NextResponse.json(
      { error: 'Failed to send broadcast message' },
      { status: 500 }
    )
  }
}