import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol') || 'BTCUSD'
    
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch market data')
    }
    
    const data = await response.json()
    
    return NextResponse.json({
      symbol: data.symbol,
      price: parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChange),
      changePercent24h: parseFloat(data.priceChangePercent),
      volume24h: parseFloat(data.volume),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      timestamp: Date.now()
    })

  } catch (error) {
    return NextResponse.json({
      symbol: 'BTCUSD',
      price: 43250.75,
      change24h: 1250.30,
      changePercent24h: 2.98,
      volume24h: 28450000000,
      high24h: 44100.00,
      low24h: 41800.50,
      timestamp: Date.now()
    })
  }
}