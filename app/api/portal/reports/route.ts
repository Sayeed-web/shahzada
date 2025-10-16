import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'SARAF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    const saraf = await prisma.saraf.findFirst({
      where: { 
        userId: session.user.id,
        status: 'APPROVED'
      }
    })

    if (!saraf) {
      return NextResponse.json({ error: 'Saraf not approved or not found' }, { status: 403 })
    }

    // Calculate date range
    const now = new Date()
    const daysBack = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))

    // Get transactions in period
    const transactions = await prisma.transaction.findMany({
      where: {
        sarafId: saraf.id,
        createdAt: {
          gte: startDate
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const completedTransactions = transactions.filter(t => t.status === 'COMPLETED')

    // Calculate metrics
    const totalTransactions = transactions.length
    const totalVolume = completedTransactions.reduce((sum, t) => sum + t.toAmount, 0)
    const totalFees = completedTransactions.reduce((sum, t) => sum + t.fee, 0)
    const averageTransaction = totalTransactions > 0 ? totalVolume / totalTransactions : 0

    // Calculate monthly growth (compare with previous period)
    const previousStartDate = new Date(startDate.getTime() - (daysBack * 24 * 60 * 60 * 1000))
    const previousTransactions = await prisma.transaction.count({
      where: {
        sarafId: saraf.id,
        createdAt: {
          gte: previousStartDate,
          lt: startDate
        }
      }
    })

    const monthlyGrowth = previousTransactions > 0 
      ? ((totalTransactions - previousTransactions) / previousTransactions) * 100 
      : 0

    // Top currencies
    const currencyStats = completedTransactions.reduce((acc: any, t) => {
      const currency = t.toCurrency
      if (!acc[currency]) {
        acc[currency] = { currency, volume: 0, count: 0 }
      }
      acc[currency].volume += t.toAmount
      acc[currency].count += 1
      return acc
    }, {})

    const topCurrencies = Object.values(currencyStats)
      .sort((a: any, b: any) => b.volume - a.volume)
      .slice(0, 5)

    // Daily stats
    const dailyStats = transactions.reduce((acc: any, t) => {
      const date = t.createdAt.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, transactions: 0, volume: 0 }
      }
      acc[date].transactions += 1
      if (t.status === 'COMPLETED') {
        acc[date].volume += t.toAmount
      }
      return acc
    }, {})

    const dailyStatsArray = Object.values(dailyStats)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      totalTransactions,
      totalVolume,
      totalFees,
      averageTransaction,
      monthlyGrowth,
      topCurrencies,
      dailyStats: dailyStatsArray
    })

  } catch (error) {
    console.error('Reports fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}