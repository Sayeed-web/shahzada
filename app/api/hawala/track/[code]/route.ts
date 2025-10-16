import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const trackingCode = sanitizeInput(params.code)
    
    if (!trackingCode) {
      return NextResponse.json({ 
        error: 'Invalid tracking code' 
      }, { status: 400 })
    }

    // Find transaction by reference code
    const transaction = await prisma.transaction.findFirst({
      where: {
        referenceCode: trackingCode,
        type: 'HAWALA'
      },
      include: {
        saraf: {
          select: {
            businessName: true,
            businessPhone: true,
            businessAddress: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json({ 
        error: 'Transaction not found' 
      }, { status: 404 })
    }

    // Return transaction details (excluding sensitive information)
    const response = {
      id: transaction.id,
      referenceCode: transaction.referenceCode,
      status: transaction.status,
      type: transaction.type,
      fromAmount: transaction.fromAmount,
      toAmount: transaction.toAmount,
      fromCurrency: transaction.fromCurrency,
      toCurrency: transaction.toCurrency,
      rate: transaction.rate,
      fee: transaction.fee,
      senderName: transaction.senderName,
      senderPhone: transaction.senderPhone,
      senderCountry: transaction.senderCountry,
      receiverName: transaction.receiverName,
      receiverPhone: transaction.receiverPhone,
      receiverCity: transaction.receiverCity,
      receiverCountry: transaction.receiverCountry || 'افغانستان',
      notes: transaction.notes,
      createdAt: transaction.createdAt.toISOString(),
      completedAt: transaction.completedAt?.toISOString(),
      saraf: transaction.saraf
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Hawala tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track transaction' },
      { status: 500 }
    )
  }
}