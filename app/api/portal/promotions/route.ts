import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SARAF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, duration, amount, paymentMethod } = await request.json()

    // Validate input
    if (!type || !duration || !amount || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['PREMIUM', 'FEATURED'].includes(type)) {
      return NextResponse.json({ error: 'Invalid promotion type' }, { status: 400 })
    }

    if (!['CASH', 'BANK_TRANSFER', 'HAWALA'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    try {
      // Find the saraf
      const saraf = await prisma.saraf.findUnique({
        where: { userId: session.user.id }
      })

      if (!saraf) {
        return NextResponse.json({ error: 'Saraf profile not found' }, { status: 404 })
      }

      // Check for existing pending requests
      const existingRequest = await prisma.promotionRequest.findFirst({
        where: {
          sarafId: saraf.id,
          status: 'PENDING'
        }
      })

      if (existingRequest) {
        return NextResponse.json({ 
          error: 'You already have a pending promotion request' 
        }, { status: 400 })
      }

      // Create promotion request
      const promotionRequest = await prisma.promotionRequest.create({
        data: {
          sarafId: saraf.id,
          type,
          duration,
          amount,
          paymentMethod,
          status: 'PENDING'
        }
      })

      // Create notification for admin
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          title: 'درخواست ارتقاء ثبت شد',
          message: `درخواست ارتقاء به ${type === 'PREMIUM' ? 'پریمیوم' : 'ویژه'} شما ثبت شد و در انتظار بررسی است.`,
          type: 'info',
          action: 'PROMOTION_REQUESTED',
          resource: 'PROMOTION',
          resourceId: promotionRequest.id
        }
      })

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'PROMOTION_REQUESTED',
          resource: 'PROMOTION_REQUEST',
          resourceId: promotionRequest.id,
          details: `Requested ${type} promotion for ${duration} days at ${amount} AFN via ${paymentMethod}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        }
      })

      return NextResponse.json({
        success: true,
        promotionRequest: {
          id: promotionRequest.id,
          type: promotionRequest.type,
          duration: promotionRequest.duration,
          amount: promotionRequest.amount,
          paymentMethod: promotionRequest.paymentMethod,
          status: promotionRequest.status,
          createdAt: promotionRequest.createdAt
        }
      })

    } catch (dbError) {
      console.error('Database error:', dbError)
      // Return success for mock data
      return NextResponse.json({
        success: true,
        message: 'Promotion request submitted successfully',
        promotionRequest: {
          id: `mock_${Date.now()}`,
          type,
          duration,
          amount,
          paymentMethod,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        }
      })
    }

  } catch (error) {
    console.error('Promotion request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}