import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeInput, validateNumericInput } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'SARAF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get saraf information
    const saraf = await prisma.saraf.findFirst({
      where: { 
        userId: session.user.id,
        status: 'APPROVED'
      }
    })

    if (!saraf) {
      return NextResponse.json({ error: 'Saraf not approved or not found' }, { status: 403 })
    }

    const body = await request.json()
    
    // Sanitize and validate inputs
    const senderName = sanitizeInput(body.senderName)
    const senderPhone = sanitizeInput(body.senderPhone)
    const senderCity = sanitizeInput(body.senderCity)
    const senderCountry = sanitizeInput(body.senderCountry) || 'Afghanistan'
    const receiverName = sanitizeInput(body.receiverName)
    const receiverPhone = sanitizeInput(body.receiverPhone)
    const receiverCity = sanitizeInput(body.receiverCity)
    const receiverCountry = sanitizeInput(body.receiverCountry) || 'Afghanistan'
    const fromCurrency = sanitizeInput(body.fromCurrency)
    const toCurrency = sanitizeInput(body.toCurrency)
    const fromAmount = validateNumericInput(body.fromAmount)
    const rate = validateNumericInput(body.rate)
    const fee = validateNumericInput(body.fee) || 0
    const notes = sanitizeInput(body.notes)

    // Validation
    if (!senderName || !senderPhone || !receiverName || !receiverPhone || 
        !fromCurrency || !toCurrency || !fromAmount || !rate || !receiverCity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (fromAmount <= 0 || fromAmount > 1000000) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    if (rate <= 0) {
      return NextResponse.json({ error: 'Invalid exchange rate' }, { status: 400 })
    }

    // Calculate amounts
    const toAmount = fromAmount * rate
    const totalFee = fee

    // Generate reference code
    const referenceCode = `HW${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // Get default branch or create one if none exists
    let defaultBranch = await prisma.sarafBranch.findFirst({
      where: {
        sarafId: saraf.id,
        isActive: true
      }
    })

    if (!defaultBranch) {
      defaultBranch = await prisma.sarafBranch.create({
        data: {
          sarafId: saraf.id,
          name: 'شعبه اصلی',
          address: saraf.businessAddress,
          phone: saraf.businessPhone,
          city: senderCity || 'Kabul',
          country: senderCountry || 'Afghanistan',
          isActive: true
        }
      })
    }

    // Create hawala transaction
    const transaction = await prisma.transaction.create({
      data: {
        referenceCode,
        type: 'HAWALA',
        status: 'PENDING',
        senderId: null, // Will be set when sender registers
        sarafId: saraf.id,
        branchId: defaultBranch.id,
        fromCurrency,
        toCurrency,
        fromAmount,
        toAmount,
        rate,
        fee: totalFee,
        senderName,
        senderPhone,
        senderCity,
        senderCountry,
        receiverName,
        receiverPhone,
        receiverCity,
        receiverCountry,
        notes,
        internalNotes: `Created by saraf: ${saraf.businessName} at branch: ${defaultBranch.name}`
      }
    })

    // Create notification for the saraf
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: 'حواله جدید ایجاد شد',
        message: `حواله ${referenceCode} با مبلغ ${fromAmount} ${fromCurrency} ایجاد شد`,
        type: 'transaction',
        action: 'HAWALA_CREATED',
        resource: 'TRANSACTION',
        resourceId: transaction.id,
        data: JSON.stringify({
          referenceCode,
          amount: fromAmount,
          currency: fromCurrency
        })
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
          sarafId: saraf.id,
          branchId: defaultBranch.id,
          branchName: defaultBranch.name
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
        rate: transaction.rate,
        fee: transaction.fee,
        senderName: transaction.senderName,
        receiverName: transaction.receiverName,
        createdAt: transaction.createdAt
      }
    })

  } catch (error) {
    console.error('Hawala creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}