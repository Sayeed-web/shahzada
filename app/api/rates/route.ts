import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sanitizeURL } from '@/lib/security'

interface ExchangeRate {
  from: string
  to: string
  rate: number
  lastUpdate: string
  source: string
}

const SUPPORTED_CURRENCIES = [
  'AFN', 'EUR', 'GBP', 'PKR', 'IRR', 'CAD', 'JPY', 'AUD', 'CHF', 'CNY', 
  'SAR', 'AED', 'INR', 'TRY', 'RUB', 'KRW', 'SGD', 'HKD', 'MXN', 'BRL',
  'ZAR', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'EGP', 'QAR', 'KWD', 'BHD',
  'OMR', 'JOD', 'LBP', 'SYP', 'IQD', 'UZS', 'KZT', 'KGS', 'TJS', 'TMT'
]
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const FALLBACK_RATES = {
  USD: { 
    AFN: 70.85, EUR: 0.85, GBP: 0.73, PKR: 280.50, IRR: 42000, CAD: 1.35, 
    JPY: 150, AUD: 1.55, CHF: 0.88, CNY: 7.25, SAR: 3.75, AED: 3.67,
    INR: 83.25, TRY: 30.15, RUB: 92.50, KRW: 1320, SGD: 1.35, HKD: 7.85,
    MXN: 17.25, BRL: 5.15, ZAR: 18.75, THB: 35.50, MYR: 4.65, IDR: 15750,
    PHP: 56.25, VND: 24500, EGP: 30.85, QAR: 3.64, KWD: 0.31, BHD: 0.38,
    OMR: 0.38, JOD: 0.71, LBP: 15000, SYP: 2512, IQD: 1310, UZS: 12250,
    KZT: 450, KGS: 89.50, TJS: 10.95, TMT: 3.50
  }
}

// In-memory cache
let ratesCache: { data: ExchangeRate[], timestamp: number } | null = null

async function fetchFromExchangeRateAPI(): Promise<ExchangeRate[]> {
  const allowedUrl = sanitizeURL('https://api.exchangerate-api.com/v4/latest/USD')
  if (!allowedUrl) throw new Error('Invalid URL')
  
  const response = await fetch(allowedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    },
    next: { revalidate: 300 }, // 5 minutes
    signal: AbortSignal.timeout(8000) // 8 second timeout for Vercel
  })
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  
  const data = await response.json()
  if (!data.rates) throw new Error('Invalid response format')
  
  return Object.entries(data.rates)
    .filter(([currency]) => SUPPORTED_CURRENCIES.includes(currency))
    .map(([currency, rate]) => ({
      from: 'USD',
      to: currency,
      rate: rate as number,
      lastUpdate: new Date().toISOString(),
      source: 'exchangerate-api'
    }))
}

async function fetchFromCurrencyLayer(): Promise<ExchangeRate[]> {
  const apiKey = process.env.CURRENCYLAYER_KEY
  if (!apiKey) throw new Error('CurrencyLayer API key not configured')
  
  const baseUrl = sanitizeURL('https://apilayer.net/api/live')
  if (!baseUrl) throw new Error('Invalid URL')
  
  const response = await fetch(
    `${baseUrl}?access_key=${apiKey}&currencies=${SUPPORTED_CURRENCIES.join(',')}&source=USD&format=1`,
    {
      headers: {
        'Accept': 'application/json'
      },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000) // 8 second timeout for Vercel
    }
  )
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  
  const data = await response.json()
  if (!data.success || !data.quotes) throw new Error('API request failed')
  
  return Object.entries(data.quotes).map(([pair, rate]) => ({
    from: 'USD',
    to: pair.replace('USD', ''),
    rate: rate as number,
    lastUpdate: new Date().toISOString(),
    source: 'currencylayer'
  }))
}

function generateCrossRates(baseRates: ExchangeRate[]): ExchangeRate[] {
  const crossRates: ExchangeRate[] = []
  const usdRates = baseRates.filter(r => r.from === 'USD')
  
  // Generate cross-currency rates
  usdRates.forEach(rate1 => {
    usdRates.forEach(rate2 => {
      if (rate1.to !== rate2.to && rate1.rate > 0) {
        crossRates.push({
          from: rate1.to,
          to: rate2.to,
          rate: Number((rate2.rate / rate1.rate).toFixed(6)),
          lastUpdate: new Date().toISOString(),
          source: 'calculated'
        })
      }
    })
  })
  
  // Generate reverse rates (to USD)
  usdRates.forEach(rate => {
    if (rate.rate > 0) {
      crossRates.push({
        from: rate.to,
        to: 'USD',
        rate: Number((1 / rate.rate).toFixed(6)),
        lastUpdate: rate.lastUpdate,
        source: rate.source
      })
    }
  })
  
  return crossRates
}

function getFallbackRates(): ExchangeRate[] {
  const rates: ExchangeRate[] = []
  const timestamp = new Date().toISOString()
  
  Object.entries(FALLBACK_RATES.USD).forEach(([currency, rate]) => {
    rates.push({
      from: 'USD',
      to: currency,
      rate,
      lastUpdate: timestamp,
      source: 'fallback'
    })
    
    rates.push({
      from: currency,
      to: 'USD',
      rate: Number((1 / rate).toFixed(6)),
      lastUpdate: timestamp,
      source: 'fallback'
    })
  })
  
  return rates
}

export async function GET(request: NextRequest) {
  try {
    // Check cache first
    if (ratesCache && Date.now() - ratesCache.timestamp < CACHE_DURATION) {
      return NextResponse.json(ratesCache.data, {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'X-Cache': 'HIT'
        }
      })
    }

    let rates: ExchangeRate[] = []
    
    // Try primary API
    try {
      rates = await fetchFromExchangeRateAPI()
    } catch (error) {
      console.warn('ExchangeRate-API failed:', error)
      
      // Try backup API
      try {
        rates = await fetchFromCurrencyLayer()
      } catch (backupError) {
        console.warn('CurrencyLayer API failed:', backupError)
      }
    }
    
    // Use fallback if all APIs failed
    if (rates.length === 0) {
      console.warn('All exchange rate APIs failed, using fallback rates')
      rates = getFallbackRates()
    } else {
      // Generate cross-currency rates
      const crossRates = generateCrossRates(rates)
      rates = [...rates, ...crossRates]
    }
    
    // Update cache
    ratesCache = {
      data: rates,
      timestamp: Date.now()
    }
    
    // Store in database for historical tracking
    try {
      for (const rate of rates.slice(0, 20)) {
        await prisma.marketData.upsert({
          where: { 
            symbol_type: {
              symbol: `${rate.from}${rate.to}`,
              type: 'forex'
            }
          },
          update: {
            price: rate.rate,
            change24h: 0,
            changePercent24h: 0,
            lastUpdate: new Date()
          },
          create: {
            symbol: `${rate.from}${rate.to}`,
            type: 'forex',
            name: `${rate.from} to ${rate.to}`,
            price: rate.rate,
            change24h: 0,
            changePercent24h: 0
          }
        })
      }
    } catch (dbError) {
      console.warn('Failed to store rates in database:', dbError)
    }
    
    return NextResponse.json(rates, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'X-Cache': 'MISS'
      }
    })
    
  } catch (error) {
    console.error('Rates API error:', error)
    
    // Return cached data if available, otherwise fallback
    const fallbackData = ratesCache?.data || getFallbackRates()
    
    return NextResponse.json(fallbackData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60',
        'X-Cache': 'ERROR-FALLBACK'
      }
    })
  }
}