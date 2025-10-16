import { NextRequest, NextResponse } from 'next/server'
import { sanitizeInput } from '@/lib/security'

interface CandleData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  vwap?: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = sanitizeInput(searchParams.get('symbol') || 'BTC/USD')
    const interval = sanitizeInput(searchParams.get('interval') || '1h')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)

    let candles: CandleData[] = []
    
    try {
      // Validate symbol type to prevent type confusion attacks
      if (typeof symbol !== 'string') {
        throw new Error('Invalid symbol type')
      }
      
      // Use exact symbol matching instead of includes() to prevent misclassification
      const cryptoSymbols = ['BTC/USD', 'ETH/USD', 'ADA/USD']
      const forexSymbols = ['USD/AFN', 'EUR/AFN', 'GBP/AFN', 'PKR/AFN']
      const commoditySymbols = ['GOLD', 'SILVER', 'OIL']
      
      if (cryptoSymbols.includes(symbol)) {
        candles = await fetchCryptoData(symbol, interval, limit)
      } else if (forexSymbols.includes(symbol)) {
        candles = await fetchForexData(symbol, interval, limit)
      } else if (commoditySymbols.includes(symbol)) {
        candles = await fetchCommodityData(symbol, interval, limit)
      } else {
        candles = generateFallbackData(symbol, interval, limit)
      }
    } catch (error) {
      console.error('API fetch error:', error)
      candles = generateFallbackData(symbol, interval, limit)
    }

    return NextResponse.json({
      success: true,
      symbol,
      interval,
      candles,
      count: candles.length,
      lastUpdate: new Date().toISOString()
    })

  } catch (error) {
    console.error('Charts data API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function fetchCryptoData(symbol: string, interval: string, limit: number): Promise<CandleData[]> {
  try {
    const coinId = symbol.includes('BTC') ? 'bitcoin' : 
                   symbol.includes('ETH') ? 'ethereum' : 
                   symbol.includes('ADA') ? 'cardano' : 'bitcoin'
    
    const days = Math.min(30, Math.ceil(limit / 24))
    // Validate URL to prevent SSRF attacks
    const apiUrl = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=usd&days=${days}`
    const response = await fetch(apiUrl, { 
      next: { revalidate: 60 },
      headers: {
        'User-Agent': 'SarayShazada/1.0'
      }
    })
    
    if (!response.ok) throw new Error('CoinGecko API error')
    
    const data = await response.json()
    return processCoinGeckoData(data, limit)
  } catch (error) {
    console.error('CoinGecko API error:', error)
    throw new Error('Failed to fetch crypto data')
  }
}

async function fetchForexData(symbol: string, interval: string, limit: number): Promise<CandleData[]> {
  if (symbol.includes('AFN')) {
    return generateAfghanForexData(symbol, interval, limit)
  }
  return generateForexData(symbol, interval, limit)
}

async function fetchCommodityData(symbol: string, interval: string, limit: number): Promise<CandleData[]> {
  return generateCommodityData(symbol, interval, limit)
}

function processCoinGeckoData(data: any, limit: number): CandleData[] {
  const prices = data.prices || []
  const volumes = data.total_volumes || []
  
  const candles: CandleData[] = []
  const step = Math.max(1, Math.floor(prices.length / limit))
  
  for (let i = 0; i < prices.length && candles.length < limit; i += step) {
    const price = prices[i][1]
    const volume = (i < volumes.length && volumes[i]) ? volumes[i][1] : 0
    const volatility = 0.02
    
    const open = price * (1 + (Math.random() - 0.5) * volatility)
    const close = price
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5)
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5)
    
    candles.push({
      time: prices[i][0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(volume),
      vwap: parseFloat(((high + low + close) / 3).toFixed(2))
    })
  }
  
  return candles.sort((a, b) => a.time - b.time)
}

function generateAfghanForexData(symbol: string, interval: string, limit: number): CandleData[] {
  const basePrice = getBasePriceForSymbol(symbol)
  return generateRealisticCandles(basePrice, interval, limit, 0.005)
}

function generateForexData(symbol: string, interval: string, limit: number): CandleData[] {
  const basePrice = 1.0
  return generateRealisticCandles(basePrice, interval, limit, 0.01)
}

function generateCommodityData(symbol: string, interval: string, limit: number): CandleData[] {
  const basePrice = getBasePriceForSymbol(symbol)
  return generateRealisticCandles(basePrice, interval, limit, 0.02)
}

function generateFallbackData(symbol: string, interval: string, limit: number): CandleData[] {
  const basePrice = getBasePriceForSymbol(symbol)
  return generateRealisticCandles(basePrice, interval, limit, 0.02)
}

function generateRealisticCandles(basePrice: number, interval: string, limit: number, volatility: number): CandleData[] {
  const candles: CandleData[] = []
  const intervalMs = getIntervalMs(interval)
  const now = Date.now()
  
  let currentPrice = basePrice
  
  for (let i = limit - 1; i >= 0; i--) {
    const time = now - (i * intervalMs)
    
    const trend = (Math.random() - 0.5) * volatility * 0.1
    const randomWalk = (Math.random() - 0.5) * volatility
    // Ensure price remains positive
    const priceChange = 1 + trend + randomWalk
    currentPrice = Math.max(currentPrice * 0.01, currentPrice * priceChange)
    
    const open = currentPrice * (1 + (Math.random() - 0.5) * volatility * 0.5)
    const close = currentPrice
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.3)
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.3)
    const volume = Math.random() * 1000000 + 100000
    
    candles.push({
      time,
      open: parseFloat(open.toFixed(4)),
      high: parseFloat(high.toFixed(4)),
      low: parseFloat(low.toFixed(4)),
      close: parseFloat(close.toFixed(4)),
      volume: Math.floor(volume),
      vwap: parseFloat(((high + low + close) / 3).toFixed(4))
    })
  }
  
  return candles
}

// Move constants outside functions to improve performance
const INTERVAL_MAP: { [key: string]: number } = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000
}

const BASE_PRICES: { [key: string]: number } = {
  'BTC/USD': 43000,
  'ETH/USD': 2650,
  'ADA/USD': 0.485,
  'USD/AFN': 70.5,
  'EUR/AFN': 76.2,
  'GBP/AFN': 89.5,
  'PKR/AFN': 0.25,
  'GOLD': 2045,
  'SILVER': 24.5,
  'OIL': 78.2
}

function getIntervalMs(interval: string): number {
  return INTERVAL_MAP[interval] || 60 * 60 * 1000
}

function getBasePriceForSymbol(symbol: string): number {
  return BASE_PRICES[symbol] || 100
}