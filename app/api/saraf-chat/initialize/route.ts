import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Enhanced session validation
    if (!session?.user?.id) {
      console.log('No session found in saraf-chat initialize')
      return NextResponse.json({ error: 'Authentication required. Please sign in.' }, { status: 401 })
    }
    
    console.log('Session found:', { userId: session.user.id, role: session.user.role })

    const { sarafId } = await request.json()

    if (!sarafId) {
      return NextResponse.json({ error: 'Saraf ID required' }, { status: 400 })
    }

    // Verify saraf exists and is approved
    const saraf = await prisma.saraf.findFirst({
      where: {
        id: sarafId,
        status: 'APPROVED',
        isActive: true
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    })

    if (!saraf) {
      return NextResponse.json({ error: 'Saraf not found or not active' }, { status: 404 })
    }

    // Check if chat session already exists between user and saraf
    let chatSession = await prisma.chatSession.findFirst({
      where: {
        userId: session.user.id,
        sarafId: sarafId,
        type: 'SARAF'
      }
    })

    // Create new session if none exists
    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: {
          userId: session.user.id,
          sarafId: sarafId,
          type: 'SARAF',
          isActive: true
        }
      })

      // Create initial welcome message from saraf
      await prisma.chatMessage.create({
        data: {
          sessionId: chatSession.id,
          senderId: saraf.userId,
          senderName: saraf.businessName,
          senderRole: 'SARAF',
          message: `سلام! من ${saraf.businessName} هستم. چگونه میتوانم به شما کمک کنم؟`,
          isRead: false
        }
      })

      // Notify saraf of new conversation
      await prisma.notification.create({
        data: {
          userId: saraf.userId,
          title: 'گفتگوی جدید',
          message: `${session.user.name} گفتگو جدیدی با شما شروع کرده است`,
          type: 'info',
          action: 'NEW_CHAT',
          resource: 'CHAT',
          resourceId: chatSession.id,
          data: JSON.stringify({
            userName: session.user.name,
            userRole: session.user.role
          })
        }
      })
    }

    // Get recent messages
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: chatSession.id },
      orderBy: { timestamp: 'asc' },
      take: 50
    })

    return NextResponse.json({
      sessionId: chatSession.id,
      sarafInfo: {
        id: saraf.id,
        name: saraf.businessName,
        address: saraf.businessAddress,
        phone: saraf.businessPhone
      },
      messages
    })

  } catch (error) {
    console.error('Saraf chat initialization error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}