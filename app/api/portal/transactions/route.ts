import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'SARAF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const saraf = await prisma.saraf.findFirst({
      where: { 
        userId: session.user.id,
        status: 'APPROVED'
      }
    })

    if (!saraf) {
      return NextResponse.json({ error: 'Saraf not approved or not found' }, { status: 403 })
    }

    const where: any = { sarafId: saraf.id }
    
    if (status && status !== 'ALL') {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { referenceCode: { contains: search } },
        { senderName: { contains: search } },
        { receiverName: { contains: search } }
      ]
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        branch: {
          select: { name: true }
        }
      }
    })

    const total = await prisma.transaction.count({ where })

    return NextResponse.json({
      transactions: transactions.map(t => ({
        ...t,
        branchName: t.branch?.name || 'شعبه اصلی'
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Transactions fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'SARAF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const transactionId = sanitizeInput(body.id)
    const status = sanitizeInput(body.status)

    if (!transactionId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['PENDING', 'COMPLETED', 'CANCELLED', 'WITHDRAWN'].includes(status)) {
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

    const transaction = await prisma.transaction.update({
      where: {
        id: transactionId,
        sarafId: saraf.id
      },
      data: {
        status: status as any,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        updatedAt: new Date()
      }
    })

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: 'وضعیت تراکنش تغییر کرد',
        message: `تراکنش ${transaction.referenceCode} به وضعیت ${
          status === 'COMPLETED' ? 'تکمیل شده' : 
          status === 'CANCELLED' ? 'لغو شده' : 
          status === 'WITHDRAWN' ? 'برداشت شده' : 'در انتظار'
        } تغییر یافت`,
        type: 'transaction',
        action: 'STATUS_CHANGED',
        resource: 'TRANSACTION',
        resourceId: transaction.id
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TRANSACTION_STATUS_UPDATED',
        resource: 'TRANSACTION',
        resourceId: transaction.id,
        details: JSON.stringify({
          referenceCode: transaction.referenceCode,
          newStatus: status
        })
      }
    })

    return NextResponse.json(transaction)

  } catch (error) {
    console.error('Transaction update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}