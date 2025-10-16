import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureDatabaseConnection } from '@/lib/database-health'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SARAF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get saraf information
    const saraf = await prisma.saraf.findFirst({
      where: { userId: session.user.id },
      include: {
        transactions: {
          select: {
            id: true,
            status: true,
            toAmount: true
          }
        },
        rates: {
          where: { isActive: true },
          select: { id: true }
        }
      }
    })

    if (!saraf) {
      return NextResponse.json({ error: 'Saraf profile not found' }, { status: 404 })
    }

    // Calculate statistics
    const totalTransactions = saraf.transactions.length
    const pendingTransactions = saraf.transactions.filter(t => t.status === 'PENDING').length
    const completedTransactions = saraf.transactions.filter(t => t.status === 'COMPLETED').length
    const totalVolume = saraf.transactions
      .filter(t => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + (t.toAmount || 0), 0)
    const activeRates = saraf.rates.length

    const stats = {
      totalTransactions,
      pendingTransactions,
      completedTransactions,
      totalVolume,
      rating: saraf.rating,
      status: saraf.status,
      activeRates
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Portal stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}