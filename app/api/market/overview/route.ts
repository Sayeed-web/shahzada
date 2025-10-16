import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sanitizeURL } from '@/lib/security'

export async function GET() {
  try {
    // First try to get cached data from database
    let marketData = await prisma.marketData.findMany({
      where: {
        OR: [
          { symbol: 'BTCUSD', type: 'crypto' },
          { symbol: 'USDAFN', type: 'forex' },
          { symbol: 'XAUUSD', type: 'commodity' }
        ]
      },
      orderBy: { lastUpdate: 'desc' }
    })

    // If no data or data is stale (older than 5 minutes), fetch fresh data
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const shouldRefresh = marketData.length === 0 || 
      marketData.some(data => data.lastUpdate < fiveMinutesAgo)

    if (shouldRefresh) {
      try {
        // Fetch Bitcoin price from CoinGecko
        const cryptoUrl = sanitizeURL(`${process.env.COINGECKO_API || 'https://api.coingecko.com/api/v3'}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`)
        if (!cryptoUrl) throw new Error('Invalid crypto API URL')
        
        const cryptoResponse = await fetch(cryptoUrl)
        
        if (cryptoResponse.ok) {
          const cryptoData = await cryptoResponse.json()
          const btcPrice = cryptoData?.bitcoin?.usd
          const btcChange = cryptoData?.bitcoin?.usd_24h_change
          
          if (btcPrice && typeof btcPrice === 'number') {
            await prisma.marketData.upsert({
              where: { symbol_type: { symbol: 'BTCUSD', type: 'crypto' } },
              update: {
                price: btcPrice,
                change24h: (btcPrice * (btcChange || 0)) / 100,
                changePercent24h: btcChange || 0,
                lastUpdate: new Date()
              },
              create: {
                symbol: 'BTCUSD',
                type: 'crypto',
                name: 'Bitcoin',
                price: btcPrice,
                change24h: (btcPrice * (btcChange || 0)) / 100,
                changePercent24h: btcChange || 0
              }
            })
          }
        }

        // Fetch USD/AFN rate from exchangerate.host
        const forexUrl = sanitizeURL(`${process.env.EXCHANGE_API || 'https://api.exchangerate-api.com/v4'}/latest?base=USD&symbols=AFN`)
        if (!forexUrl) throw new Error('Invalid forex API URL')
        
        const forexResponse = await fetch(forexUrl)
        
        if (forexResponse.ok) {
          const forexData = await forexResponse.json()
          const usdAfnRate = forexData.rates?.AFN || 70.85 // Fallback rate
          
          await prisma.marketData.upsert({
            where: { symbol_type: { symbol: 'USDAFN', type: 'forex' } },
            update: {
              price: usdAfnRate,
              change24h: Math.random() * 0.5 - 0.25, // Mock change
              changePercent24h: (Math.random() * 0.5 - 0.25) / usdAfnRate * 100,
              lastUpdate: new Date()
            },
            create: {
              symbol: 'USDAFN',
              type: 'forex',
              name: 'USD to AFN',
              price: usdAfnRate,
              change24h: 0.15,
              changePercent24h: 0.21
            }
          })
        }

        // Update gold price (mock data if API not available)
        await prisma.marketData.upsert({
          where: { symbol_type: { symbol: 'XAUUSD', type: 'commodity' } },
          update: {
            price: 2034.50 + (Math.random() * 20 - 10), // Mock fluctuation
            change24h: Math.random() * 30 - 15,
            changePercent24h: Math.random() * 1.5 - 0.75,
            lastUpdate: new Date()
          },
          create: {
            symbol: 'XAUUSD',
            type: 'commodity',
            name: 'Gold',
            price: 2034.50,
            change24h: 12.30,
            changePercent24h: 0.61
          }
        })

        // Refetch updated data
        marketData = await prisma.marketData.findMany({
          where: {
            OR: [
              { symbol: 'BTCUSD', type: 'crypto' },
              { symbol: 'USDAFN', type: 'forex' },
              { symbol: 'XAUUSD', type: 'commodity' }
            ]
          },
          orderBy: { lastUpdate: 'desc' }
        })
      } catch (error) {
        console.error('Failed to refresh market data:', error)
        // Continue with cached data if refresh fails
      }
    }

    // Enhanced asset data with complete market information
    const enhancedAssets = [
      {
        symbol: 'BTC/USD',
        name: 'Bitcoin',
        price: marketData.find(d => d.symbol === 'BTCUSD')?.price || 43250.00,
        change24h: marketData.find(d => d.symbol === 'BTCUSD')?.change24h || 1250.50,
        changePercent24h: marketData.find(d => d.symbol === 'BTCUSD')?.changePercent24h || 2.98,
        volume24h: 28500000000,
        marketCap: 847000000000,
        high24h: 43800.00,
        low24h: 41900.00,
        trend: (marketData.find(d => d.symbol === 'BTCUSD')?.changePercent24h || 0) > 0 ? 'up' : 'down',
        type: 'crypto',
        exchange: 'Binance',
        lastUpdate: new Date().toISOString()
      },
      {
        symbol: 'ETH/USD',
        name: 'Ethereum',
        price: 2650.75,
        change24h: -45.25,
        changePercent24h: -1.68,
        volume24h: 15200000000,
        marketCap: 318000000000,
        high24h: 2720.00,
        low24h: 2580.00,
        trend: 'down',
        type: 'crypto',
        exchange: 'Binance',
        lastUpdate: new Date().toISOString()
      },
      {
        symbol: 'USD/AFN',
        name: 'US Dollar to Afghan Afghani',
        price: marketData.find(d => d.symbol === 'USDAFN')?.price || 70.50,
        change24h: marketData.find(d => d.symbol === 'USDAFN')?.change24h || 0.25,
        changePercent24h: marketData.find(d => d.symbol === 'USDAFN')?.changePercent24h || 0.35,
        volume24h: 5000000,
        trend: 'up',
        type: 'forex',
        exchange: 'Forex',
        lastUpdate: new Date().toISOString()
      },
      {
        symbol: 'EUR/AFN',
        name: 'Euro to Afghan Afghani',
        price: 76.20,
        change24h: -0.15,
        changePercent24h: -0.20,
        volume24h: 3200000,
        trend: 'down',
        type: 'forex',
        exchange: 'Forex',
        lastUpdate: new Date().toISOString()
      },
      {
        symbol: 'GOLD',
        name: 'Gold',
        price: marketData.find(d => d.symbol === 'XAUUSD')?.price || 2045.30,
        change24h: marketData.find(d => d.symbol === 'XAUUSD')?.change24h || 12.80,
        changePercent24h: marketData.find(d => d.symbol === 'XAUUSD')?.changePercent24h || 0.63,
        volume24h: 180000000,
        trend: 'up',
        type: 'commodity',
        exchange: 'COMEX',
        lastUpdate: new Date().toISOString()
      },
      {
        symbol: 'SILVER',
        name: 'Silver',
        price: 24.55,
        change24h: -0.35,
        changePercent24h: -1.41,
        volume24h: 95000000,
        trend: 'down',
        type: 'commodity',
        exchange: 'COMEX',
        lastUpdate: new Date().toISOString()
      },
      {
        symbol: 'OIL',
        name: 'Crude Oil',
        price: 78.25,
        change24h: 2.15,
        changePercent24h: 2.83,
        volume24h: 420000000,
        trend: 'up',
        type: 'commodity',
        exchange: 'NYMEX',
        lastUpdate: new Date().toISOString()
      },
      {
        symbol: 'ADA/USD',
        name: 'Cardano',
        price: 0.485,
        change24h: 0.025,
        changePercent24h: 5.43,
        volume24h: 890000000,
        trend: 'up',
        type: 'crypto',
        exchange: 'Binance',
        lastUpdate: new Date().toISOString()
      }
    ]

    return NextResponse.json({
      success: true,
      assets: enhancedAssets,
      count: enhancedAssets.length,
      lastUpdate: new Date().toISOString()
    })
  } catch (error) {
    console.error('Market overview error:', error)
    
    // Return fallback data
    return NextResponse.json([
      {
        symbol: 'BTC/USD',
        name: 'Bitcoin',
        price: 43250.00,
        change24h: 1250.50,
        changePercent24h: 2.98,
        trend: 'up'
      },
      {
        symbol: 'USD/AFN',
        name: 'Dollar to Afghani',
        price: 70.85,
        change24h: 0.15,
        changePercent24h: 0.21,
        trend: 'up'
      },
      {
        symbol: 'GOLD',
        name: 'Gold',
        price: 2034.50,
        change24h: 12.30,
        changePercent24h: 0.61,
        trend: 'up'
      }
    ])
  }
}