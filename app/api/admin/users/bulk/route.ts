import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userIds, action } = await request.json()

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 })
    }

    if (!['activate', 'deactivate', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    try {
      let result
      
      switch (action) {
        case 'activate':
          result = await prisma.user.updateMany({
            where: { id: { in: userIds } },
            data: { isActive: true }
          })
          break
          
        case 'deactivate':
          result = await prisma.user.updateMany({
            where: { id: { in: userIds } },
            data: { isActive: false }
          })
          break
          
        case 'delete':
          // Soft delete by marking as inactive and adding deleted timestamp
          result = await prisma.user.updateMany({
            where: { id: { in: userIds } },
            data: { 
              isActive: false,
              // Add deleted timestamp to email to prevent conflicts
              email: prisma.raw(`CONCAT(email, '_deleted_', ${Date.now()})`)
            }
          })
          break
      }

      // Log the bulk action
      try {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: `BULK_USER_${action.toUpperCase()}`,
            resource: 'USER',
            resourceId: userIds.join(','),
            details: `Bulk ${action} performed on ${userIds.length} users`
          }
        })
      } catch (auditError) {
        console.warn('Failed to create audit log:', auditError)
      }

      return NextResponse.json({
        success: true,
        affected: result.count,
        action
      })

    } catch (dbError) {
      console.error('Database error in bulk user operation:', dbError)
      return NextResponse.json(
        { error: 'Database operation failed' },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('Bulk user operation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}