import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transactionId, notes } = await request.json()
    
    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })
    }

    const sanitizedId = sanitizeInput(transactionId)
    const sanitizedNotes = sanitizeInput(notes || '')

    const transaction = await prisma.transaction.findUnique({
      where: { id: sanitizedId },
      include: { saraf: true }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (transaction.status !== 'PENDING') {
      return NextResponse.json({ error: 'Only pending transactions can be completed' }, { status: 400 })
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isSaraf = session.user.role === 'SARAF' && transaction.sarafId === session.user.sarafId
    
    if (!isAdmin && !isSaraf) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: sanitizedId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        handlerId: session.user.id,
        internalNotes: sanitizedNotes ? `${transaction.internalNotes || ''}\n${new Date().toISOString()}: Completed by ${session.user.name}. ${sanitizedNotes}` : transaction.internalNotes
      }
    })

    await prisma.saraf.update({
      where: { id: transaction.sarafId },
      data: {
        totalTransactions: { increment: 1 }
      }
    })

    await prisma.notification.create({
      data: {
        userId: transaction.senderId || session.user.id,
        title: 'حواله تکمیل شد',
        message: `حواله ${transaction.referenceCode} با موفقیت تکمیل شد`,
        type: 'success',
        action: 'TRANSACTION_COMPLETED',
        resource: 'TRANSACTION',
        resourceId: transaction.id
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'HAWALA_COMPLETED',
        resource: 'TRANSACTION',
        resourceId: transaction.id,
        details: JSON.stringify({ 
          completedBy: session.user.name,
          notes: sanitizedNotes 
        })
      }
    })

    return NextResponse.json({
      success: true,
      transaction: {
        id: updatedTransaction.id,
        status: updatedTransaction.status,
        referenceCode: updatedTransaction.referenceCode,
        completedAt: updatedTransaction.completedAt
      }
    })

  } catch (error) {
    console.error('Hawala completion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
