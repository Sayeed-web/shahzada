import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const status = searchParams.get('status') // 'active', 'inactive', 'all'

    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {}
    if (status === 'active') {
      whereClause.isActive = true
    } else if (status === 'inactive') {
      whereClause.isActive = false
    }

    try {
      const [sessions, totalCount] = await Promise.all([
        prisma.chatSession.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                message: true,
                timestamp: true,
                senderRole: true,
                isRead: true,
                createdAt: true
              }
            },
            _count: {
              select: {
                messages: true
              }
            }
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.chatSession.count({ where: whereClause })
      ])

      const totalPages = Math.ceil(totalCount / limit)

      return NextResponse.json({
        sessions,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      })

    } catch (dbError) {
      console.error('Database error in admin chat sessions:', dbError)
      
      // Return empty data if database fails
      return NextResponse.json({
        sessions: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          hasNext: false,
          hasPrev: false
        }
      })
    }

  } catch (error) {
    console.error('Admin chat sessions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, sessionIds } = await request.json()

    if (!action || !sessionIds || !Array.isArray(sessionIds)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    try {
      let result
      
      switch (action) {
        case 'close':
          result = await prisma.chatSession.updateMany({
            where: { id: { in: sessionIds } },
            data: { isActive: false }
          })
          break
          
        case 'reopen':
          result = await prisma.chatSession.updateMany({
            where: { id: { in: sessionIds } },
            data: { isActive: true }
          })
          break
          
        case 'mark_read':
          await prisma.chatMessage.updateMany({
            where: { 
              sessionId: { in: sessionIds },
              senderRole: { not: 'ADMIN' }
            },
            data: { isRead: true }
          })
          result = { count: sessionIds.length }
          break
          
        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
      }

      // Log the admin action
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: `CHAT_BULK_${action.toUpperCase()}`,
          resource: 'CHAT',
          details: JSON.stringify({
            sessionIds,
            affectedCount: result.count
          })
        }
      })

      return NextResponse.json({
        success: true,
        affectedCount: result.count,
        action
      })

    } catch (dbError) {
      console.error('Database error in admin chat bulk action:', dbError)
      return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
    }

  } catch (error) {
    console.error('Admin chat bulk action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}