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
      const [
        totalSessions,
        activeSessions,
        unreadMessages,
        pendingResponses,
        todayMessages,
        weeklyStats
      ] = await Promise.all([
        // Total chat sessions
        prisma.chatSession.count(),
        
        // Active sessions
        prisma.chatSession.count({
          where: { isActive: true }
        }),
        
        // Unread messages from users
        prisma.chatMessage.count({
          where: {
            isRead: false,
            senderRole: { not: 'ADMIN' }
          }
        }),
        
        // Sessions with pending responses (last message from user)
        prisma.chatSession.count({
          where: {
            isActive: true,
            messages: {
              some: {
                senderRole: { not: 'ADMIN' },
                createdAt: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
              }
            }
          }
        }),
        
        // Today's messages
        prisma.chatMessage.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        
        // Weekly message stats
        prisma.chatMessage.groupBy({
          by: ['senderRole'],
          _count: {
            id: true
          },
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        })
      ])

      // Calculate response time statistics
      const responseTimeStats = await prisma.$queryRaw`
        SELECT 
          AVG(
            CASE 
              WHEN admin_msg.createdAt IS NOT NULL 
              THEN (julianday(admin_msg.createdAt) - julianday(user_msg.createdAt)) * 24 * 60
              ELSE NULL 
            END
          ) as avg_response_time_minutes
        FROM chat_messages user_msg
        LEFT JOIN chat_messages admin_msg ON (
          admin_msg.sessionId = user_msg.sessionId 
          AND admin_msg.senderRole = 'ADMIN'
          AND admin_msg.createdAt > user_msg.createdAt
        )
        WHERE user_msg.senderRole != 'ADMIN'
        AND user_msg.createdAt >= datetime('now', '-7 days')
      ` as any[]

      const avgResponseTime = responseTimeStats[0]?.avg_response_time_minutes || 0

      // Get hourly distribution for today
      const hourlyDistribution = await prisma.$queryRaw`
        SELECT 
          strftime('%H', createdAt) as hour,
          COUNT(*) as count
        FROM chat_messages
        WHERE date(createdAt) = date('now')
        GROUP BY strftime('%H', createdAt)
        ORDER BY hour
      ` as any[]

      return NextResponse.json({
        totalSessions,
        activeSessions,
        unreadMessages,
        pendingResponses,
        todayMessages,
        avgResponseTimeMinutes: Math.round(avgResponseTime),
        weeklyStats: {
          userMessages: weeklyStats.find(s => s.senderRole === 'USER')?._count.id || 0,
          adminMessages: weeklyStats.find(s => s.senderRole === 'ADMIN')?._count.id || 0,
          systemMessages: weeklyStats.find(s => s.senderRole === 'SYSTEM')?._count.id || 0
        },
        hourlyDistribution: hourlyDistribution.map(h => ({
          hour: parseInt(h.hour),
          count: h.count
        }))
      })

    } catch (dbError) {
      console.error('Database error in admin chat stats:', dbError)
      
      // Return fallback stats if database fails
      return NextResponse.json({
        totalSessions: 0,
        activeSessions: 0,
        unreadMessages: 0,
        pendingResponses: 0,
        todayMessages: 0,
        avgResponseTimeMinutes: 0,
        weeklyStats: {
          userMessages: 0,
          adminMessages: 0,
          systemMessages: 0
        },
        hourlyDistribution: []
      })
    }

  } catch (error) {
    console.error('Admin chat stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}