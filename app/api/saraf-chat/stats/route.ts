import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      let stats = {
        totalConversations: 0,
        unreadMessages: 0,
        averageResponseTime: '5 دقیقه',
        todayMessages: 0,
        activeConversations: 0,
        responseRate: 95
      }

      if (session.user.role === 'SARAF') {
        const saraf = await prisma.saraf.findUnique({
          where: { userId: session.user.id }
        })

        if (saraf) {
          const sessions = await prisma.chatSession.findMany({
            where: {
              id: { contains: `saraf-${saraf.id}` }
            }
          })

          const totalConversations = sessions.length
          
          let unreadMessages = 0
          for (const session of sessions) {
            const unreadCount = await prisma.chatMessage.count({
              where: {
                sessionId: session.id,
                senderRole: { not: 'SARAF' },
                isRead: false
              }
            })
            unreadMessages += unreadCount
          }

          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          const todayMessages = await prisma.chatMessage.count({
            where: {
              sessionId: { in: sessions.map(s => s.id) },
              timestamp: { gte: today }
            }
          })

          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
          const activeConversations = await prisma.chatSession.count({
            where: {
              id: { contains: `saraf-${saraf.id}` },
              updatedAt: { gte: yesterday }
            }
          })

          stats = {
            totalConversations,
            unreadMessages,
            averageResponseTime: '5 دقیقه',
            todayMessages,
            activeConversations,
            responseRate: 95
          }
        }
      }

      return NextResponse.json(stats)

    } catch (dbError) {
      console.error('Database error in saraf chat stats:', dbError)
      throw dbError
    }

  } catch (error) {
    console.error('Saraf chat stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}