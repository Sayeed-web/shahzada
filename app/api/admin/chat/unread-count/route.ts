import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const unreadCount = await prisma.chatMessage.count({
        where: {
          senderRole: { not: 'ADMIN' },
          isRead: false
        }
      })

      return NextResponse.json({ count: unreadCount })
    } catch (dbError) {
      console.error('Database error in unread count:', dbError)
      return NextResponse.json({ count: 0 })
    }

  } catch (error) {
    console.error('Unread count error:', error)
    return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 })
  }
}