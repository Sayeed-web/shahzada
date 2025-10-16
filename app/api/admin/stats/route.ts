import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const [
        totalUsers,
        totalSarafs,
        pendingSarafs,
        totalTransactions,
        pendingTransactions,
        totalVolumeResult,
        recentTransactions,
        activeUsers
      ] = await Promise.all([
        prisma.user.count().catch(() => 0),
        prisma.saraf.count({ where: { status: 'APPROVED' } }).catch(() => 0),
        prisma.saraf.count({ where: { status: 'PENDING' } }).catch(() => 0),
        prisma.transaction.count().catch(() => 0),
        prisma.transaction.count({ where: { status: 'PENDING' } }).catch(() => 0),
        prisma.transaction.aggregate({
          _sum: { fromAmount: true },
          where: { status: 'COMPLETED' }
        }).catch(() => ({ _sum: { fromAmount: 0 } })),
        prisma.transaction.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        }).catch(() => 0),
        prisma.user.count({
          where: {
            lastLogin: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }).catch(() => 0)
      ])

      const totalVolume = totalVolumeResult._sum.fromAmount || 0

      let systemHealth: 'good' | 'warning' | 'error' = 'good'
      
      if (pendingSarafs > 5 || pendingTransactions > 20 || activeUsers < totalUsers * 0.1) {
        systemHealth = 'warning'
      }
      
      if (pendingSarafs > 15 || pendingTransactions > 50 || activeUsers < totalUsers * 0.05) {
        systemHealth = 'error'
      }

      const stats = {
        totalUsers,
        totalSarafs,
        pendingSarafs,
        totalTransactions,
        pendingTransactions,
        totalVolume,
        systemHealth,
        recentTransactions,
        activeUsers,
        conversionRate: totalUsers > 0 ? (totalSarafs / totalUsers * 100).toFixed(2) : '0',
        avgTransactionValue: totalTransactions > 0 ? (totalVolume / totalTransactions).toFixed(2) : '0',
        lastUpdated: new Date().toISOString()
      }

      return NextResponse.json(stats)
    } catch (dbError) {
      console.error('Database error in admin stats:', dbError)
      
      // Return fallback stats
      const fallbackStats = {
        totalUsers: 0,
        totalSarafs: 0,
        pendingSarafs: 0,
        totalTransactions: 0,
        pendingTransactions: 0,
        totalVolume: 0,
        systemHealth: 'warning' as const,
        recentTransactions: 0,
        activeUsers: 0,
        conversionRate: '0',
        avgTransactionValue: '0',
        lastUpdated: new Date().toISOString(),
        fallback: true
      }
      
      return NextResponse.json(fallbackStats)
    }
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}