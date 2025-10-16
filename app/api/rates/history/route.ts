import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const base = searchParams.get('base') || 'USD'
  const to = searchParams.get('to') || 'AFN'
  const period = searchParams.get('period') || '30d'

  try {
    // Parse period
    const days = parseInt(period.replace('d', ''))
    
    // Generate historical data (in production, this would come from database)
    const historicalData = []
    const baseRate = base === 'USD' && to === 'AFN' ? 70.85 : 1
    
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Add some realistic variation
      const variation = (Math.random() - 0.5) * 0.05 // ±2.5% variation
      const rate = baseRate * (1 + variation)
      
      historicalData.push({
        date: date.toISOString().split('T')[0],
        rate: Math.round(rate * 10000) / 10000,
        high: Math.round(rate * 1.01 * 10000) / 10000,
        low: Math.round(rate * 0.99 * 10000) / 10000,
        volume: Math.floor(Math.random() * 1000000) + 500000
      })
    }

    const sanitizedBase = base.replace(/[<>"'&]/g, '')
    const sanitizedTo = to.replace(/[<>"'&]/g, '')
    const sanitizedPeriod = period.replace(/[<>"'&]/g, '')
    
    return NextResponse.json({
      base: sanitizedBase,
      target: sanitizedTo,
      period: sanitizedPeriod,
      data: historicalData
    })
  } catch (error) {
    console.error('Historical rates error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    )
  }
}