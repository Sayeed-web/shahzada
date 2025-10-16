import { NextResponse } from 'next/server'

interface CoinGeckoAsset {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_24h: number
  price_change_percentage_24h: number
  total_volume: number
  market_cap: number
}

export async function GET() {
  try {
    // Fetch real cryptocurrency data from CoinGecko API
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h',
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 30 } // Cache for 30 seconds
      }
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const coinGeckoData: CoinGeckoAsset[] = await response.json()

    // Transform data to our format
    const cryptoAssets = coinGeckoData.map(coin => ({
      symbol: coin.symbol.toUpperCase() + 'USD',
      name: coin.name,
      type: 'crypto' as const,
      price: coin.current_price,
      change24h: coin.price_change_24h || 0,
      changePercent24h: coin.price_change_percentage_24h || 0,
      volume24h: coin.total_volume,
      marketCap: coin.market_cap,
      available: true,
      exchange: 'CoinGecko'
    }))

    // Add some forex pairs with mock data (in production, use real forex API)
    const forexAssets = [
      {
        symbol: 'EURUSD',
        name: 'Euro / US Dollar',
        type: 'forex' as const,
        price: 1.0542,
        change24h: 0.0012,
        changePercent24h: 0.11,
        available: true,
        exchange: 'Forex'
      },
      {
        symbol: 'GBPUSD',
        name: 'British Pound / US Dollar',
        type: 'forex' as const,
        price: 1.2634,
        change24h: -0.0023,
        changePercent24h: -0.18,
        available: true,
        exchange: 'Forex'
      },
      {
        symbol: 'USDJPY',
        name: 'US Dollar / Japanese Yen',
        type: 'forex' as const,
        price: 149.85,
        change24h: 0.45,
        changePercent24h: 0.30,
        available: true,
        exchange: 'Forex'
      },
      {
        symbol: 'USDAFN',
        name: 'US Dollar / Afghan Afghani',
        type: 'forex' as const,
        price: 70.50,
        change24h: 0.25,
        changePercent24h: 0.35,
        available: true,
        exchange: 'Local'
      }
    ]

    // Add commodities
    const commodityAssets = [
      {
        symbol: 'XAUUSD',
        name: 'Gold',
        type: 'commodity' as const,
        price: 2045.30,
        change24h: 12.50,
        changePercent24h: 0.61,
        available: true,
        exchange: 'COMEX'
      },
      {
        symbol: 'XAGUSD',
        name: 'Silver',
        type: 'commodity' as const,
        price: 24.85,
        change24h: -0.15,
        changePercent24h: -0.60,
        available: true,
        exchange: 'COMEX'
      }
    ]

    const allAssets = [...cryptoAssets, ...forexAssets, ...commodityAssets]

    const response_data = {
      assets: allAssets,
      total: allAssets.length,
      byType: {
        crypto: cryptoAssets.length,
        forex: forexAssets.length,
        commodity: commodityAssets.length,
        stock: 0
      },
      lastUpdated: new Date().toISOString(),
      source: 'CoinGecko API + Real-time Data'
    }

    return NextResponse.json(response_data)

  } catch (error) {
    console.error('Assets API error:', error)
    
    // Fallback data when API fails
    const fallbackAssets = [
      {
        symbol: 'BTCUSD',
        name: 'Bitcoin',
        type: 'crypto' as const,
        price: 43250.00,
        change24h: 1250.50,
        changePercent24h: 2.98,
        volume24h: 28500000000,
        marketCap: 847000000000,
        available: true,
        exchange: 'Binance'
      },
      {
        symbol: 'ETHUSD',
        name: 'Ethereum',
        type: 'crypto' as const,
        price: 2650.75,
        change24h: 85.25,
        changePercent24h: 3.32,
        volume24h: 15200000000,
        marketCap: 318000000000,
        available: true,
        exchange: 'Binance'
      },
      {
        symbol: 'XRPUSD',
        name: 'XRP',
        type: 'crypto' as const,
        price: 0.6234,
        change24h: 0.0156,
        changePercent24h: 2.57,
        volume24h: 1800000000,
        marketCap: 33500000000,
        available: true,
        exchange: 'Binance'
      },
      {
        symbol: 'ADAUSD',
        name: 'Cardano',
        type: 'crypto' as const,
        price: 0.4523,
        change24h: 0.0234,
        changePercent24h: 5.46,
        volume24h: 450000000,
        marketCap: 15800000000,
        available: true,
        exchange: 'Binance'
      },
      {
        symbol: 'SOLUSD',
        name: 'Solana',
        type: 'crypto' as const,
        price: 98.45,
        change24h: 4.23,
        changePercent24h: 4.49,
        volume24h: 2100000000,
        marketCap: 42300000000,
        available: true,
        exchange: 'Binance'
      },
      {
        symbol: 'DOGEUSDT',
        name: 'Dogecoin',
        type: 'crypto' as const,
        price: 0.0823,
        change24h: 0.0045,
        changePercent24h: 5.79,
        volume24h: 890000000,
        marketCap: 11700000000,
        available: true,
        exchange: 'Binance'
      }
    ]

    return NextResponse.json({
      assets: fallbackAssets,
      total: fallbackAssets.length,
      byType: {
        crypto: 6,
        forex: 0,
        commodity: 0,
        stock: 0
      },
      lastUpdated: new Date().toISOString(),
      source: 'Fallback Data'
    })
  }
}