import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    try {
      const messages = await prisma.chatMessage.findMany({
        where: {
          senderRole: { not: 'ADMIN' }
        },
        include: {
          session: true
        },
        orderBy: { timestamp: 'desc' },
        take: limit
      })

      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        message: msg.message,
        timestamp: msg.timestamp.toISOString(),
        senderName: msg.senderName,
        senderRole: msg.senderRole,
        sessionId: msg.sessionId,
        isRead: msg.isRead
      }))

      return NextResponse.json({ messages: formattedMessages })
    } catch (dbError) {
      console.error('Database error in recent messages:', dbError)
      return NextResponse.json({ messages: [] })
    }

  } catch (error) {
    console.error('Recent messages error:', error)
    return NextResponse.json({ error: 'Failed to fetch recent messages' }, { status: 500 })
  }
}