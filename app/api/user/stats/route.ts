import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get user transactions
    const transactions = await prisma.transaction.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Get unread notifications
    const unreadNotifications = await prisma.notification.count({
      where: {
        userId,
        read: false
      }
    })

    // Calculate stats
    const totalTransactions = transactions.length
    const totalVolume = transactions
      .filter(t => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.toAmount, 0)

    // Get recent activity
    const recentActivity = transactions.slice(0, 5).map(transaction => ({
      id: transaction.id,
      type: 'transaction',
      description: `حواله به ${transaction.receiverName}`,
      amount: transaction.toAmount,
      status: transaction.status,
      timestamp: transaction.createdAt.toISOString(),
      referenceCode: transaction.referenceCode
    }))

    // Add recent notifications to activity
    const recentNotifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3
    })

    const notificationActivities = recentNotifications.map(notification => ({
      id: notification.id,
      type: 'notification',
      description: notification.title,
      timestamp: notification.createdAt.toISOString()
    }))

    const allActivity = [...recentActivity, ...notificationActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)

    return NextResponse.json({
      totalTransactions,
      totalVolume,
      unreadNotifications,
      accountStatus: 'active',
      recentActivity: allActivity
    })

  } catch (error) {
    console.error('User stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}