import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, message, sarafId, fileUrl } = await request.json()

    if (!sessionId || (!message?.trim() && !fileUrl)) {
      return NextResponse.json({ error: 'Session ID and message or file required' }, { status: 400 })
    }

    // Verify session exists and user has access
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, sarafId: true }
    })

    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 })
    }

    // Verify user has access to this session
    const isUserOwner = chatSession.userId === session.user.id
    let isSarafOwner = false

    if (chatSession.sarafId) {
      const saraf = await prisma.saraf.findUnique({
        where: { id: chatSession.sarafId },
        select: { userId: true }
      })
      isSarafOwner = saraf?.userId === session.user.id
    }

    if (!isUserOwner && !isSarafOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create the message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        senderId: session.user.id,
        senderName: session.user.name || 'کاربر',
        senderRole: session.user.role || 'USER',
        message: message?.trim() || '',
        fileUrl: fileUrl || null,
        isRead: false
      }
    })

    // Update session timestamp
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() }
    })

    // Notify the other party
    const targetUserId = isUserOwner && chatSession.sarafId ? 
      (await prisma.saraf.findUnique({ where: { id: chatSession.sarafId }, select: { userId: true } }))?.userId :
      chatSession.userId

    if (targetUserId && targetUserId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: 'پیام جدید',
          message: `${session.user.name}: ${message?.substring(0, 50) || 'فایل جدید'}${message && message.length > 50 ? '...' : ''}`,
          type: 'info',
          action: 'NEW_MESSAGE',
          resource: 'CHAT',
          resourceId: sessionId,
          data: JSON.stringify({
            senderName: session.user.name,
            messagePreview: message?.substring(0, 100) || 'File attachment'
          })
        }
      })
    }

    // Log the message
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'SARAF_CHAT_MESSAGE_SENT',
        resource: 'CHAT',
        resourceId: sessionId,
        details: JSON.stringify({
          messageId: chatMessage.id,
          messageLength: message?.length || 0,
          hasFile: !!fileUrl,
          sarafId: chatSession.sarafId || null
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: {
        id: chatMessage.id,
        sessionId: chatMessage.sessionId,
        senderId: chatMessage.senderId,
        senderName: chatMessage.senderName,
        senderRole: chatMessage.senderRole,
        message: chatMessage.message,
        fileUrl: chatMessage.fileUrl,
        timestamp: chatMessage.timestamp,
        isRead: chatMessage.isRead,
        createdAt: chatMessage.createdAt
      }
    })

  } catch (error) {
    console.error('Saraf chat send error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}