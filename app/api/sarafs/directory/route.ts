import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured') === 'true'

    const whereClause: any = {
      status: 'APPROVED',
      isActive: true
    }

    if (featured) {
      whereClause.isFeatured = true
    }

    const sarafs = await prisma.saraf.findMany({
      where: whereClause,
      include: {
        rates: {
          where: {
            isActive: true,
            OR: [
              { validUntil: { gt: new Date() } },
              { validUntil: null }
            ]
          },
          take: 5,
          orderBy: { updatedAt: 'desc' }
        },
        user: {
          select: {
            name: true,
            phone: true
          }
        },
        _count: {
          select: {
            transactions: {
              where: { status: 'COMPLETED' }
            },
            ratings: true
          }
        }
      },
      orderBy: [
        { isPremium: 'desc' },
        { isFeatured: 'desc' },
        { rating: 'desc' },
        { totalTransactions: 'desc' },
        { createdAt: 'desc' }
      ],
      take: featured ? 10 : 50
    })

    return NextResponse.json({
      sarafs: sarafs.map(saraf => ({
        id: saraf.id,
        businessName: saraf.businessName,
        businessAddress: saraf.businessAddress,
        businessPhone: saraf.businessPhone,
        rating: Number(saraf.rating.toFixed(1)),
        totalTransactions: saraf.totalTransactions,
        completedTransactions: saraf._count.transactions,
        totalRatings: saraf._count.ratings,
        isActive: saraf.isActive,
        isPremium: saraf.isPremium,
        isFeatured: saraf.isFeatured,
        ownerName: saraf.user.name,
        contactPhone: saraf.user.phone,
        createdAt: saraf.createdAt,
        rates: saraf.rates.map(rate => ({
          fromCurrency: rate.fromCurrency,
          toCurrency: rate.toCurrency,
          buyRate: rate.buyRate,
          sellRate: rate.sellRate,
          lastUpdate: rate.updatedAt
        }))
      })),
      total: sarafs.length,
      featured: featured
    })
  } catch (error) {
    console.error('Saraf directory error:', error)
    return NextResponse.json([], { status: 200 })
  }
}
