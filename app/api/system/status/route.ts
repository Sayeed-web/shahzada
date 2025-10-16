import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [
      userCount,
      adminCount,
      sarafCount,
      approvedSarafs,
      pendingSarafs,
      transactionCount,
      chatSessions,
      chatMessages,
      courses,
      contentItems,
      notifications
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.saraf.count(),
      prisma.saraf.count({ where: { status: 'APPROVED' } }),
      prisma.saraf.count({ where: { status: 'PENDING' } }),
      prisma.transaction.count(),
      prisma.chatSession.count(),
      prisma.chatMessage.count(),
      prisma.educationCourse.count(),
      prisma.contentItem.count(),
      prisma.notification.count()
    ])

    return NextResponse.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      database: 'connected',
      systems: {
        users: {
          total: userCount,
          admins: adminCount,
          status: 'operational'
        },
        sarafs: {
          total: sarafCount,
          approved: approvedSarafs,
          pending: pendingSarafs,
          status: 'operational'
        },
        transactions: {
          total: transactionCount,
          status: 'operational'
        },
        messaging: {
          sessions: chatSessions,
          messages: chatMessages,
          status: 'operational'
        },
        education: {
          courses: courses,
          status: 'operational'
        },
        content: {
          items: contentItems,
          status: 'operational'
        },
        notifications: {
          total: notifications,
          status: 'operational'
        }
      }
    })
  } catch (error) {
    console.error('System status error:', error)
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Failed to fetch system status'
    }, { status: 500 })
  }
}
