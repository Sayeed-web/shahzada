import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol') || 'BTC'
  const period = searchParams.get('period') || '30d'

  try {
    // Parse period with validation
    const days = parseInt(period.replace('d', ''))
    
    if (isNaN(days) || days <= 0 || days > 365) {
      return NextResponse.json(
        { error: 'Invalid period. Must be between 1d and 365d' },
        { status: 400 }
      )
    }
    
    // Base prices for different cryptocurrencies
    const basePrices: { [key: string]: number } = {
      'BTC': 43250,
      'ETH': 2680,
      'USDT': 1.00,
      'BNB': 315,
      'ADA': 0.45,
      'SOL': 98,
      'DOGE': 0.08,
      'MATIC': 0.85
    }
    
    const basePrice = basePrices[symbol.toUpperCase()] || 100
    
    // Generate historical data
    const historicalData = []
    
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Add realistic price variation
      const variation = (Math.random() - 0.5) * 0.1 // ±5% variation
      const price = basePrice * (1 + variation)
      
      historicalData.push({
        date: date.toISOString().split('T')[0],
        price: Math.round(price * 100) / 100,
        priceAfn: Math.round(price * 70.85 * 100) / 100,
        volume: Math.floor(Math.random() * 1000000000) + 100000000,
        marketCap: Math.floor(price * 19000000) // Approximate for BTC
      })
    }

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      period,
      data: historicalData
    })
  } catch (error) {
    console.error('Crypto history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch crypto history' },
      { status: 500 }
    )
  }
}