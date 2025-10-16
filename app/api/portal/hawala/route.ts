import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SARAF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get saraf information
    const saraf = await prisma.saraf.findFirst({
      where: { userId: session.user.id }
    })

    if (!saraf || saraf.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Saraf not approved' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate required fields
    const requiredFields = [
      'senderName', 'senderPhone', 'senderIdType', 'senderIdNumber',
      'receiverName', 'receiverPhone', 'receiverCity', 'fromAmount',
      'fromCurrency', 'toCurrency', 'exchangeRate'
    ]
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ 
          error: `Missing required field: ${field}` 
        }, { status: 400 })
      }
    }

    // Sanitize inputs
    const sanitizedData = {
      senderName: sanitizeInput(body.senderName),
      senderPhone: sanitizeInput(body.senderPhone),
      senderAddress: sanitizeInput(body.senderAddress || ''),
      senderIdType: sanitizeInput(body.senderIdType),
      senderIdNumber: sanitizeInput(body.senderIdNumber),
      receiverName: sanitizeInput(body.receiverName),
      receiverPhone: sanitizeInput(body.receiverPhone),
      receiverCity: sanitizeInput(body.receiverCity),
      receiverAddress: sanitizeInput(body.receiverAddress || ''),
      fromAmount: parseFloat(body.fromAmount),
      fromCurrency: sanitizeInput(body.fromCurrency),
      toCurrency: sanitizeInput(body.toCurrency),
      exchangeRate: parseFloat(body.exchangeRate),
      purpose: sanitizeInput(body.purpose || ''),
      notes: sanitizeInput(body.notes || '')
    }

    // Validate amounts
    if (sanitizedData.fromAmount <= 0 || sanitizedData.exchangeRate <= 0) {
      return NextResponse.json({ 
        error: 'Invalid amount or exchange rate' 
      }, { status: 400 })
    }

    // Calculate amounts
    const toAmount = sanitizedData.fromAmount * sanitizedData.exchangeRate
    const fee = Math.max(toAmount * 0.02, 50) // 2% fee, minimum 50 AFN
    
    // Generate reference code
    const referenceCode = `HW${Date.now().toString(36).toUpperCase()}`

    // Create hawala transaction
    const transaction = await prisma.transaction.create({
      data: {
        referenceCode,
        type: 'HAWALA',
        status: 'PENDING',
        sarafId: saraf.id,
        fromCurrency: sanitizedData.fromCurrency,
        toCurrency: sanitizedData.toCurrency,
        fromAmount: sanitizedData.fromAmount,
        toAmount,
        rate: sanitizedData.exchangeRate,
        fee,
        senderName: sanitizedData.senderName,
        senderPhone: sanitizedData.senderPhone,
        receiverName: sanitizedData.receiverName,
        receiverPhone: sanitizedData.receiverPhone,
        receiverCity: sanitizedData.receiverCity,
        notes: sanitizedData.notes
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'HAWALA_CREATED',
        resource: 'TRANSACTION',
        resourceId: transaction.id,
        details: JSON.stringify({
          referenceCode: transaction.referenceCode,
          amount: sanitizedData.fromAmount,
          currency: sanitizedData.fromCurrency
        })
      }
    })

    return NextResponse.json({
      success: true,
      referenceCode: transaction.referenceCode,
      transactionId: transaction.id,
      message: 'Hawala transaction created successfully'
    })

  } catch (error) {
    console.error('Hawala creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create hawala transaction' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SARAF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get saraf information
    const saraf = await prisma.saraf.findFirst({
      where: { userId: session.user.id }
    })

    if (!saraf) {
      return NextResponse.json({ error: 'Saraf not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      sarafId: saraf.id,
      type: 'HAWALA'
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    // Get transactions
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          referenceCode: true,
          status: true,
          fromAmount: true,
          toAmount: true,
          fromCurrency: true,
          toCurrency: true,
          rate: true,
          fee: true,
          senderName: true,
          receiverName: true,
          receiverCity: true,
          createdAt: true,
          completedAt: true
        }
      }),
      prisma.transaction.count({ where })
    ])

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Hawala fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hawala transactions' },
      { status: 500 }
    )
  }
}