import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'overview'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {}

    try {
      switch (reportType) {
        case 'financial':
          const financialData = await generateFinancialReport(dateFilter)
          return NextResponse.json(financialData)
          
        case 'users':
          const userData = await generateUserReport(dateFilter)
          return NextResponse.json(userData)
          
        case 'sarafs':
          const sarafData = await generateSarafReport(dateFilter)
          return NextResponse.json(sarafData)
          
        case 'transactions':
          const transactionData = await generateTransactionReport(dateFilter)
          return NextResponse.json(transactionData)
          
        default:
          const overviewData = await generateOverviewReport(dateFilter)
          return NextResponse.json(overviewData)
      }
    } catch (dbError) {
      console.error('Database error in reports:', dbError)
      console.error('Database error in reports:', dbError)
      return NextResponse.json({
        error: 'Database connection failed',
        ...generateEmptyReport(reportType)
      }, { status: 503 })
    }

  } catch (error) {
    console.error('Admin reports error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

async function generateFinancialReport(dateFilter: any) {
  const [
    totalVolume,
    totalFees,
    transactionsByType,
    monthlyVolume
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: { status: 'COMPLETED', ...dateFilter },
      _sum: { toAmount: true, fee: true }
    }),
    prisma.transaction.aggregate({
      where: { status: 'COMPLETED', ...dateFilter },
      _sum: { fee: true }
    }),
    prisma.transaction.groupBy({
      by: ['type'],
      where: { status: 'COMPLETED', ...dateFilter },
      _sum: { toAmount: true },
      _count: true
    }),
    prisma.transaction.groupBy({
      by: ['createdAt'],
      where: { status: 'COMPLETED', ...dateFilter },
      _sum: { toAmount: true }
    })
  ])

  return {
    totalVolume: totalVolume._sum.toAmount || 0,
    totalFees: totalFees._sum.fee || 0,
    transactionsByType,
    monthlyTrends: monthlyVolume
  }
}

async function generateUserReport(dateFilter: any) {
  const [
    totalUsers,
    newUsers,
    activeUsers,
    usersByRole
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: dateFilter }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.groupBy({
      by: ['role'],
      _count: true
    })
  ])

  return {
    totalUsers,
    newUsers,
    activeUsers,
    usersByRole
  }
}

async function generateSarafReport(dateFilter: any) {
  const [
    totalSarafs,
    approvedSarafs,
    pendingSarafs,
    premiumSarafs
  ] = await Promise.all([
    prisma.saraf.count(),
    prisma.saraf.count({ where: { status: 'APPROVED' } }),
    prisma.saraf.count({ where: { status: 'PENDING' } }),
    prisma.saraf.count({ where: { isPremium: true } })
  ])

  return {
    totalSarafs,
    approvedSarafs,
    pendingSarafs,
    premiumSarafs
  }
}

async function generateTransactionReport(dateFilter: any) {
  const [
    totalTransactions,
    completedTransactions,
    pendingTransactions,
    transactionVolume
  ] = await Promise.all([
    prisma.transaction.count({ where: dateFilter }),
    prisma.transaction.count({ where: { status: 'COMPLETED', ...dateFilter } }),
    prisma.transaction.count({ where: { status: 'PENDING', ...dateFilter } }),
    prisma.transaction.aggregate({
      where: { status: 'COMPLETED', ...dateFilter },
      _sum: { toAmount: true }
    })
  ])

  return {
    totalTransactions,
    completedTransactions,
    pendingTransactions,
    totalVolume: transactionVolume._sum.toAmount || 0
  }
}

async function generateOverviewReport(dateFilter: any) {
  const [
    userStats,
    sarafStats,
    transactionStats,
    financialStats
  ] = await Promise.all([
    generateUserReport(dateFilter),
    generateSarafReport(dateFilter),
    generateTransactionReport(dateFilter),
    generateFinancialReport(dateFilter)
  ])

  return {
    users: userStats,
    sarafs: sarafStats,
    transactions: transactionStats,
    financial: financialStats
  }
}

function generateEmptyReport(reportType: string) {
  // Return empty data structure instead of fake data
  const emptyData = {
    overview: {
      users: { totalUsers: 0, newUsers: 0, activeUsers: 0, usersByRole: [] },
      sarafs: { totalSarafs: 0, approvedSarafs: 0, pendingSarafs: 0, premiumSarafs: 0 },
      transactions: { totalTransactions: 0, completedTransactions: 0, pendingTransactions: 0, totalVolume: 0 },
      financial: { totalVolume: 0, totalFees: 0, transactionsByType: [] }
    },
    financial: { totalVolume: 0, totalFees: 0, transactionsByType: [], monthlyTrends: [] },
    users: { totalUsers: 0, newUsers: 0, activeUsers: 0, usersByRole: [] },
    sarafs: { totalSarafs: 0, approvedSarafs: 0, pendingSarafs: 0, premiumSarafs: 0 },
    transactions: { totalTransactions: 0, completedTransactions: 0, pendingTransactions: 0, totalVolume: 0 }
  }

  return emptyData[reportType as keyof typeof emptyData] || emptyData.overview
}