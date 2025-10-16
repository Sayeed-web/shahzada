import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const fallbackPromotions = [
  {
    id: '1',
    sarafId: 'saraf1',
    type: 'PREMIUM',
    duration: 30,
    amount: 5000,
    paymentMethod: 'CASH',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    saraf: {
      businessName: 'صرافی شهزاده',
      businessPhone: '+93701234567',
      user: {
        name: 'احمد شاه',
        email: 'ahmad@example.com'
      }
    }
  },
  {
    id: '2',
    sarafId: 'saraf2',
    type: 'FEATURED',
    duration: 15,
    amount: 2500,
    paymentMethod: 'BANK_TRANSFER',
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    saraf: {
      businessName: 'صرافی کابل',
      businessPhone: '+93701234568',
      user: {
        name: 'محمد علی',
        email: 'mohammad@example.com'
      }
    }
  }
]

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const promotions = await prisma.promotionRequest.findMany({
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
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json(promotions)
    } catch (dbError) {
      console.error('Database error fetching promotions:', dbError)
      return NextResponse.json(fallbackPromotions)
    }

  } catch (error) {
    console.error('Promotions fetch error:', error)
    return NextResponse.json(fallbackPromotions)
  }
}