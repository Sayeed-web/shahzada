import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = params.id

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Verify session exists
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { userId: true }
    })

    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Extract saraf ID from session ID
    const sessionParts = sessionId.split('-')
    if (sessionParts.length < 3 || sessionParts[0] !== 'saraf') {
      return NextResponse.json({ error: 'Invalid session format' }, { status: 400 })
    }
    
    const sarafId = sessionParts[2]

    // Get saraf info
    const saraf = await prisma.saraf.findUnique({
      where: { id: sarafId },
      select: { userId: true, businessName: true }
    })

    if (!saraf) {
      return NextResponse.json({ error: 'Saraf not found' }, { status: 404 })
    }

    const isUserOwner = chatSession.userId === session.user.id
    const isSarafOwner = saraf.userId === session.user.id

    if (!isUserOwner && !isSarafOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get messages
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { timestamp: 'asc' }
    })

    // Mark messages as read
    if (isUserOwner) {
      await prisma.chatMessage.updateMany({
        where: {
          sessionId,
          senderRole: 'SARAF',
          isRead: false
        },
        data: { isRead: true }
      })
    } else if (isSarafOwner) {
      await prisma.chatMessage.updateMany({
        where: {
          sessionId,
          senderRole: 'USER',
          isRead: false
        },
        data: { isRead: true }
      })
    }

    return NextResponse.json({
      messages,
      sarafInfo: {
        id: sarafId,
        name: saraf.businessName
      }
    })

  } catch (error) {
    console.error('Get saraf messages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}