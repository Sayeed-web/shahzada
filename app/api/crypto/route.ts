import { NextResponse } from 'next/server'

const COINGECKO_API = 'https://api.coingecko.com/api/v3'
const USD_TO_AFN = 70.5

const CRYPTO_IDS = [
  'bitcoin', 'ethereum', 'tether', 'binancecoin', 'ripple', 'cardano', 
  'solana', 'polkadot', 'dogecoin', 'avalanche-2', 'polygon-pos', 'chainlink',
  'litecoin', 'uniswap', 'stellar', 'monero', 'ethereum-classic', 'bitcoin-cash'
]

export async function GET() {
  try {
    const response = await fetch(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${CRYPTO_IDS.join(',')}&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`,
      { next: { revalidate: 120 } }
    )

    if (!response.ok) throw new Error('CoinGecko API failed')

    const data = await response.json()

    const cryptoData = data.map((coin: any) => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      priceAfn: coin.current_price * USD_TO_AFN,
      change24h: coin.price_change_24h || 0,
      changePercent24h: coin.price_change_percentage_24h || 0,
      volume24h: coin.total_volume || 0,
      marketCap: coin.market_cap || 0,
      trend: (coin.price_change_percentage_24h || 0) > 0.5 ? 'up' : 
             (coin.price_change_percentage_24h || 0) < -0.5 ? 'down' : 'neutral'
    }))

    return NextResponse.json(cryptoData)
  } catch (error) {
    console.error('Crypto API error:', error)
    return NextResponse.json({ error: 'Failed to fetch crypto data' }, { status: 500 })
  }
}