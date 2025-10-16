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

    try {
      let chatSessions = []

      if (session.user.role === 'SARAF') {
        // Get sessions where saraf is involved
        const saraf = await prisma.saraf.findFirst({
          where: { userId: session.user.id }
        })

        if (saraf) {
          // Find chat sessions where saraf has sent or received messages
          const sessions = await prisma.chatSession.findMany({
            where: {
              messages: {
                some: {
                  OR: [
                    { senderId: session.user.id },
                    { senderRole: 'USER' } // Messages from users to this saraf
                  ]
                }
              }
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                  id: true,
                  message: true,
                  senderName: true,
                  senderRole: true,
                  isRead: true,
                  createdAt: true
                }
              },
              _count: {
                select: {
                  messages: {
                    where: {
                      isRead: false,
                      senderRole: { not: 'SARAF' }
                    }
                  }
                }
              }
            },
            orderBy: { updatedAt: 'desc' }
          })

          chatSessions = sessions.map(session => ({
            id: session.id,
            user: session.user,
            lastMessage: session.messages[0]?.message || '',
            lastMessageSender: session.messages[0]?.senderName || '',
            lastMessageTime: session.messages[0]?.createdAt || session.createdAt,
            unreadCount: session._count.messages,
            isActive: session.isActive
          }))
        }
      } else {
        // Get user's chat sessions with sarafs
        const sessions = await prisma.chatSession.findMany({
          where: {
            userId: session.user.id,
            isActive: true
          },
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                message: true,
                senderName: true,
                senderRole: true,
                isRead: true,
                createdAt: true
              }
            },
            _count: {
              select: {
                messages: {
                  where: {
                    isRead: false,
                    senderRole: 'SARAF'
                  }
                }
              }
            }
          },
          orderBy: { updatedAt: 'desc' }
        })

        chatSessions = sessions.map(session => ({
          id: session.id,
          sarafName: session.messages[0]?.senderRole === 'SARAF' ? session.messages[0]?.senderName : 'صراف',
          lastMessage: session.messages[0]?.message || '',
          lastMessageTime: session.messages[0]?.createdAt || session.createdAt,
          unreadCount: session._count.messages,
          isActive: session.isActive
        }))
      }

      return NextResponse.json(chatSessions)
    } catch (dbError) {
      console.error('Database error in saraf chat sessions:', dbError)
      return NextResponse.json({ error: 'Failed to fetch chat sessions' }, { status: 500 })
    }
  } catch (error) {
    console.error('Saraf chat sessions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}