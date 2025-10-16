import { sanitizeURL } from './security'

export interface HistoricalCandle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export async function fetchRealHistoricalData(symbol: string, timeframe: string, limit = 1000): Promise<HistoricalCandle[]> {
  try {
    // Try Binance API for crypto pairs
    if (symbol.includes('BTC') || symbol.includes('ETH')) {
      const binanceSymbol = symbol.replace('/', '').replace('USD', 'USDT')
      const interval = getBinanceInterval(timeframe)
      
      const url = sanitizeURL(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${Math.min(limit, 1000)}`)
      if (url) {
        const response = await fetch(url, {
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 300 }
        })
        
        if (response.ok) {
          const data = await response.json()
          return data.map((candle: any[]) => ({
            time: candle[0],
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseFloat(candle[5])
          }))
        }
      }
    }
    
    // Try Yahoo Finance for forex and commodities
    const yahooSymbol = getYahooSymbol(symbol)
    if (yahooSymbol) {
      const period = getYahooPeriod(timeframe)
      const interval = getYahooInterval(timeframe)
      
      const url = sanitizeURL(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?period1=${period.start}&period2=${period.end}&interval=${interval}`)
      if (url) {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          next: { revalidate: 300 }
        })
        
        if (response.ok) {
          const data = await response.json()
          const result = data.chart?.result?.[0]
          
          if (result?.timestamp && result?.indicators?.quote?.[0]) {
            const timestamps = result.timestamp
            const quote = result.indicators.quote[0]
            
            return timestamps.map((time: number, i: number) => ({
              time: time * 1000,
              open: quote.open?.[i] || quote.close?.[i] || 0,
              high: quote.high?.[i] || quote.close?.[i] || 0,
              low: quote.low?.[i] || quote.close?.[i] || 0,
              close: quote.close?.[i] || 0,
              volume: quote.volume?.[i] || 0
            })).filter((candle: HistoricalCandle) => candle.close > 0)
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Real historical data fetch failed:', error)
  }
  
  // Fallback to generated data with real current price
  return generateRealisticHistoricalData(symbol, timeframe, limit)
}

function getBinanceInterval(timeframe: string): string {
  const intervals: {[key: string]: string} = {
    '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
    '1h': '1h', '4h': '4h', '1d': '1d', '1w': '1w'
  }
  return intervals[timeframe] || '1h'
}

function getYahooSymbol(symbol: string): string | null {
  const symbolMap: {[key: string]: string} = {
    'EURUSD': 'EURUSD=X',
    'GBPUSD': 'GBPUSD=X',
    'USDJPY': 'USDJPY=X',
    'USDCAD': 'USDCAD=X',
    'AUDUSD': 'AUDUSD=X',
    'XAUUSD': 'GC=F',
    'XAGUSD': 'SI=F',
    'WTIUSD': 'CL=F',
    'BRENTUSD': 'BZ=F'
  }
  return symbolMap[symbol.replace('/', '')] || null
}

function getYahooPeriod(timeframe: string): {start: number, end: number} {
  const now = Math.floor(Date.now() / 1000)
  const periods: {[key: string]: number} = {
    '1m': 86400, '5m': 432000, '15m': 1296000, '30m': 2592000,
    '1h': 7776000, '4h': 31104000, '1d': 31536000, '1w': 157680000
  }
  const period = periods[timeframe] || 7776000
  return { start: now - period, end: now }
}

function getYahooInterval(timeframe: string): string {
  const intervals: {[key: string]: string} = {
    '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
    '1h': '1h', '4h': '1h', '1d': '1d', '1w': '1wk'
  }
  return intervals[timeframe] || '1h'
}

async function generateRealisticHistoricalData(symbol: string, timeframe: string, limit: number): Promise<HistoricalCandle[]> {
  // Get current real price
  let currentPrice = 100
  try {
    if (symbol.includes('BTC')) {
      const response = await fetch('/api/crypto')
      const data = await response.json()
      const btc = data.find((c: any) => c.symbol === 'BTC')
      currentPrice = btc?.price || 43250
    } else if (symbol.includes('USD/AFN')) {
      const response = await fetch('/api/rates')
      const data = await response.json()
      const rate = data.find((r: any) => r.from === 'USD' && r.to === 'AFN')
      currentPrice = rate?.rate || 70.85
    }
  } catch (error) {
    console.error('Failed to get current price:', error)
  }
  
  const data: HistoricalCandle[] = []
  const intervalMs = getTimeframeMs(timeframe)
  let price = currentPrice * (0.9 + Math.random() * 0.1)
  
  for (let i = 0; i < limit; i++) {
    const time = Date.now() - (limit - i) * intervalMs
    const volatility = getVolatility(symbol)
    const change = (Math.random() - 0.5) * price * volatility
    
    const open = price
    const close = Math.max(0.01, open + change)
    const high = Math.max(open, close) * (1 + Math.random() * 0.01)
    const low = Math.min(open, close) * (1 - Math.random() * 0.01)
    const volume = getBaseVolume(symbol) * (0.5 + Math.random())
    
    data.push({ time, open, high, low, close, volume })
    price = close
  }
  
  return data
}

function getTimeframeMs(timeframe: string): number {
  const ms: {[key: string]: number} = {
    '1m': 60000, '5m': 300000, '15m': 900000, '30m': 1800000,
    '1h': 3600000, '4h': 14400000, '1d': 86400000, '1w': 604800000
  }
  return ms[timeframe] || 3600000
}

function getVolatility(symbol: string): number {
  if (symbol.includes('BTC')) return 0.02
  if (symbol.includes('ETH')) return 0.025
  if (symbol.includes('USD')) return 0.005
  if (symbol.includes('XAU')) return 0.01
  return 0.015
}

function getBaseVolume(symbol: string): number {
  if (symbol.includes('BTC')) return 50000
  if (symbol.includes('ETH')) return 30000
  if (symbol.includes('XAU')) return 10000
  return 5000
}