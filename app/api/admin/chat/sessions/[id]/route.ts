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
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = params.id

    try {
      const chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true
            }
          },
          messages: {
            orderBy: { timestamp: 'desc' },
            take: 1,
            select: {
              id: true,
              message: true,
              timestamp: true,
              senderRole: true,
              isRead: true
            }
          },
          _count: {
            select: {
              messages: true
            }
          }
        }
      })

      if (!chatSession) {
        return NextResponse.json({ error: 'Chat session not found' }, { status: 404 })
      }

      return NextResponse.json(chatSession)

    } catch (dbError) {
      console.error('Database error in chat session fetch:', dbError)
      return NextResponse.json(
        { error: 'Database operation failed' },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('Chat session fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = params.id

    try {
      // First delete all messages in the session
      await prisma.chatMessage.deleteMany({
        where: { sessionId }
      })

      // Then delete the session
      await prisma.chatSession.delete({
        where: { id: sessionId }
      })

      // Log the action
      try {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'CHAT_SESSION_DELETED',
            resource: 'CHAT_SESSION',
            resourceId: sessionId,
            details: 'Chat session and all messages deleted'
          }
        })
      } catch (auditError) {
        console.warn('Failed to create audit log:', auditError)
      }

      return NextResponse.json({ success: true })

    } catch (dbError) {
      console.error('Database error in chat session deletion:', dbError)
      return NextResponse.json(
        { error: 'Database operation failed' },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('Chat session deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = params.id
    const { isActive } = await request.json()

    try {
      const chatSession = await prisma.chatSession.update({
        where: { id: sessionId },
        data: { 
          isActive: isActive !== false,
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        chatSession
      })

    } catch (dbError) {
      console.error('Database error in chat session update:', dbError)
      return NextResponse.json(
        { error: 'Database operation failed' },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('Chat session update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}