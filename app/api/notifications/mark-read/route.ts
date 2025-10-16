import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notificationId } = await request.json()
    
    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
    }

    const sanitizedId = sanitizeInput(notificationId)

    const notification = await prisma.notification.updateMany({
      where: {
        id: sanitizedId,
        userId: session.user.id
      },
      data: {
        read: true,
        readAt: new Date()
      }
    })

    if (notification.count === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Mark notification as read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
