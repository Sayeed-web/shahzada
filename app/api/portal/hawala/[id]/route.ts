import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'SARAF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transactionId = params.id
    const body = await request.json()
    const status = sanitizeInput(body.status)

    if (!['PENDING', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const saraf = await prisma.saraf.findFirst({
      where: { 
        userId: session.user.id,
        status: 'APPROVED'
      }
    })

    if (!saraf) {
      return NextResponse.json({ error: 'Saraf not approved or not found' }, { status: 403 })
    }

    try {
      // Verify transaction belongs to this saraf
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          sarafId: saraf.id,
          type: 'HAWALA'
        }
      })

      if (!transaction) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
      }

      // Update transaction status
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: { 
          status,
          completedAt: status === 'COMPLETED' ? new Date() : null,
          updatedAt: new Date()
        }
      })

      // Create notification for sender if exists
      if (transaction.senderId) {
        await prisma.notification.create({
          data: {
            userId: transaction.senderId,
            title: 'بروزرسانی وضعیت حواله',
            message: `وضعیت حواله ${transaction.referenceCode} به ${
              status === 'COMPLETED' ? 'تکمیل شده' : 
              status === 'CANCELLED' ? 'لغو شده' : 'در انتظار'
            } تغییر کرد`,
            type: 'transaction',
            action: 'HAWALA_STATUS_UPDATED',
            resource: 'TRANSACTION',
            resourceId: transactionId
          }
        })
      }

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'HAWALA_STATUS_UPDATED',
          resource: 'TRANSACTION',
          resourceId: transactionId,
          details: JSON.stringify({
            referenceCode: transaction.referenceCode,
            oldStatus: transaction.status,
            newStatus: status
          })
        }
      })

      return NextResponse.json({
        success: true,
        transaction: updatedTransaction
      })

    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Database operation failed' }, { status: 503 })
    }

  } catch (error) {
    console.error('Hawala update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}