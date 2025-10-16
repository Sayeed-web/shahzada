import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeInput, validateNumericInput } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Sanitize and validate inputs
    const senderName = sanitizeInput(body.senderName)
    const senderPhone = sanitizeInput(body.senderPhone)
    const senderCity = sanitizeInput(body.senderCity) || 'کابل'
    const receiverName = sanitizeInput(body.receiverName)
    const receiverPhone = sanitizeInput(body.receiverPhone)
    const receiverCity = sanitizeInput(body.receiverCity)
    const fromCurrency = sanitizeInput(body.fromCurrency) || 'USD'
    const toCurrency = sanitizeInput(body.toCurrency) || 'AFN'
    const fromAmount = validateNumericInput(body.fromAmount)
    const rate = validateNumericInput(body.rate) || 70.5
    const fee = validateNumericInput(body.fee) || 0
    const notes = sanitizeInput(body.notes)
    const sarafId = sanitizeInput(body.sarafId)

    // Verify saraf exists and is active
    const saraf = await prisma.saraf.findFirst({
      where: {
        id: sarafId,
        status: 'APPROVED',
        isActive: true
      }
    })

    if (!saraf) {
      return NextResponse.json({ error: 'صرافی انتخاب شده یافت نشد یا غیرفعال است' }, { status: 400 })
    }

    if (!senderName || !senderPhone || !receiverName || !receiverPhone || !fromAmount || !receiverCity || !sarafId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (fromAmount <= 0 || fromAmount > 1000000) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Calculate to amount
    const toAmount = fromAmount * rate

    // Generate reference code
    const referenceCode = `HW${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // Create hawala transaction
    const transaction = await prisma.transaction.create({
      data: {
        referenceCode,
        type: 'HAWALA',
        status: 'PENDING',
        senderId: session.user.id,
        sarafId,
        fromCurrency,
        toCurrency,
        fromAmount,
        toAmount,
        rate,
        fee,
        senderName,
        senderPhone,
        senderCity,
        senderCountry: 'Afghanistan',
        receiverName,
        receiverPhone,
        receiverCity,
        receiverCountry: 'Afghanistan',
        notes
      }
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: 'حواله جدید ایجاد شد',
        message: `حواله ${referenceCode} با مبلغ ${fromAmount} ${fromCurrency} ایجاد شد`,
        type: 'transaction',
        action: 'HAWALA_CREATED',
        resource: 'TRANSACTION',
        resourceId: transaction.id
      }
    })

    // Update saraf transaction count
    await prisma.saraf.update({
      where: { id: sarafId },
      data: {
        totalTransactions: {
          increment: 1
        }
      }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'HAWALA_CREATED',
        resource: 'TRANSACTION',
        resourceId: transaction.id,
        details: JSON.stringify({
          referenceCode,
          fromAmount,
          fromCurrency,
          toCurrency,
          sarafId
        })
      }
    })

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        referenceCode: transaction.referenceCode,
        status: transaction.status,
        fromAmount: transaction.fromAmount,
        toAmount: transaction.toAmount,
        fromCurrency: transaction.fromCurrency,
        toCurrency: transaction.toCurrency,
        createdAt: transaction.createdAt
      }
    })

  } catch (error) {
    console.error('Hawala creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const referenceCode = sanitizeInput(searchParams.get('tracking'))

    if (referenceCode) {
      // Get specific hawala by reference code
      const transaction = await prisma.transaction.findFirst({
        where: {
          referenceCode,
          type: 'HAWALA'
        },
        include: {
          saraf: {
            select: {
              businessName: true,
              businessPhone: true
            }
          }
        }
      })

      if (!transaction) {
        return NextResponse.json({ error: 'Hawala not found' }, { status: 404 })
      }
      
      return NextResponse.json({
        id: transaction.id,
        referenceCode: transaction.referenceCode,
        type: transaction.type,
        status: transaction.status,
        fromAmount: transaction.fromAmount,
        toAmount: transaction.toAmount,
        fromCurrency: transaction.fromCurrency,
        toCurrency: transaction.toCurrency,
        rate: transaction.rate,
        fee: transaction.fee,
        senderName: transaction.senderName,
        senderPhone: transaction.senderPhone,
        senderCity: transaction.senderCity,
        senderCountry: transaction.senderCountry,
        receiverName: transaction.receiverName,
        receiverPhone: transaction.receiverPhone,
        receiverCity: transaction.receiverCity,
        receiverCountry: transaction.receiverCountry,
        notes: transaction.notes,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        completedAt: transaction.completedAt,
        saraf: transaction.saraf
      })
    }

    // Get user's hawala transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        senderId: session.user.id,
        type: 'HAWALA'
      },
      include: {
        saraf: {
          select: {
            businessName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      referenceCode: transaction.referenceCode,
      status: transaction.status,
      fromAmount: transaction.fromAmount,
      toAmount: transaction.toAmount,
      fromCurrency: transaction.fromCurrency,
      toCurrency: transaction.toCurrency,
      senderName: transaction.senderName,
      receiverName: transaction.receiverName,
      createdAt: transaction.createdAt,
      saraf: transaction.saraf
    }))

    return NextResponse.json({
      transactions: formattedTransactions,
      total: formattedTransactions.length
    })

  } catch (error) {
    console.error('Hawala fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}