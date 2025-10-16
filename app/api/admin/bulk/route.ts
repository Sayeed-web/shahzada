import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, ids, data } = await request.json()
    
    if (!action || !ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const sanitizedIds = ids.map(id => sanitizeInput(id)).filter(Boolean)
    let result = { success: 0, failed: 0, errors: [] as string[] }

    switch (action) {
      case 'approve_sarafs':
        const approveResult = await prisma.saraf.updateMany({
          where: { id: { in: sanitizedIds } },
          data: { status: 'APPROVED' }
        })
        result.success = approveResult.count
        break

      case 'suspend_users':
        const suspendResult = await prisma.user.updateMany({
          where: { id: { in: sanitizedIds } },
          data: { isActive: false }
        })
        result.success = suspendResult.count
        break

      case 'complete_transactions':
        const completeResult = await prisma.transaction.updateMany({
          where: { 
            id: { in: sanitizedIds },
            status: 'PENDING'
          },
          data: { 
            status: 'COMPLETED',
            completedAt: new Date()
          }
        })
        result.success = completeResult.count
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Bulk operation completed: ${result.success} items processed`
    })

  } catch (error) {
    console.error('Bulk operation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}