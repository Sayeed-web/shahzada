import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const promotionId = params.id

    try {
      const promotion = await prisma.promotionRequest.update({
        where: { id: promotionId },
        data: {
          status: body.status,
          updatedAt: new Date()
        },
        include: {
          saraf: {
            select: {
              businessName: true,
              businessPhone: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })

      // If approved, update saraf premium status
      if (body.status === 'APPROVED') {
        await prisma.saraf.update({
          where: { id: promotion.sarafId },
          data: {
            isPremium: true,
            premiumExpiresAt: new Date(Date.now() + (promotion.duration * 24 * 60 * 60 * 1000))
          }
        })
      }

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'PROMOTION_STATUS_UPDATED',
          resource: 'PROMOTION',
          resourceId: promotion.id,
          details: JSON.stringify({ status: body.status })
        }
      })

      return NextResponse.json(promotion)
    } catch (dbError) {
      console.error('Database error updating promotion:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 503 })
    }

  } catch (error) {
    console.error('Promotion update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}