import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = params.id

    try {
      // Mark all messages in this session as read
      await prisma.chatMessage.updateMany({
        where: {
          sessionId,
          senderRole: { not: 'ADMIN' },
          isRead: false
        },
        data: {
          isRead: true
        }
      })

      return NextResponse.json({ success: true })
    } catch (dbError) {
      console.error('Database error in mark read:', dbError)
      return NextResponse.json({ error: 'Database operation failed' }, { status: 503 })
    }

  } catch (error) {
    console.error('Mark read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}