'use client'

import { useEffect, useRef, useState } from 'react'

interface CandleData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  vwap?: number
  trades?: number
}

interface MarketAsset {
  symbol: string
  name: string
  price: number
  change24h: number
  changePercent24h: number
  volume24h?: number
  marketCap?: number
  high24h?: number
  low24h?: number
  trend: 'up' | 'down' | 'neutral'
  type: 'crypto' | 'forex' | 'commodity' | 'stock'
  sector?: string
  exchange?: string
  lastUpdate?: string
}

interface RealMarketDataFetcherProps {
  selectedAsset: string
  timeframe: string
  onDataUpdate: (data: CandleData[]) => void
  onAssetsUpdate: (assets: MarketAsset[]) => void
  onConnectionStatusChange: (status: 'connected' | 'disconnected' | 'connecting') => void
  isRealTime: boolean
}

export function RealMarketDataFetcher({
  selectedAsset,
  timeframe,
  onDataUpdate,
  onAssetsUpdate,
  onConnectionStatusChange,
  isRealTime
}: RealMarketDataFetcherProps) {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting')
  const wsRef = useRef<WebSocket | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCount = useRef(0)
  const maxRetries = 5

  // Update connection status
  const updateConnectionStatus = (status: 'connected' | 'disconnected' | 'connecting') => {
    setConnectionStatus(status)
    onConnectionStatusChange(status)
  }

  // Fetch market assets data
  const fetchMarketAssets = async () => {
    try {
      const response = await fetch('/api/market/overview')
      if (response.ok) {
        const data = await response.json()
        onAssetsUpdate(data.assets || [])
      } else {
        // Fallback to mock data if API fails
        const fallbackAssets: MarketAsset[] = [
          {
            symbol: 'BTC/USD',
            name: 'Bitcoin',
            price: 43250.50,
            change24h: 1250.30,
            changePercent24h: 2.98,
            volume24h: 28500000000,
            marketCap: 847000000000,
            high24h: 43800.00,
            low24h: 41900.00,
            trend: 'up',
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
            price: 70.50,
            change24h: 0.25,
            changePercent24h: 0.35,
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
            price: 2045.30,
            change24h: 12.80,
            changePercent24h: 0.63,
            volume24h: 180000000,
            trend: 'up',
            type: 'commodity',
            exchange: 'COMEX',
            lastUpdate: new Date().toISOString()
          }
        ]
        onAssetsUpdate(fallbackAssets)
      }
    } catch (error) {
      console.error('Error fetching market assets:', error)
      updateConnectionStatus('disconnected')
    }
  }

  // Fetch historical candle data
  const fetchCandleData = async (symbol: string, interval: string) => {
    try {
      const response = await fetch(`/api/charts/data?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=100`)
      if (response.ok) {
        const data = await response.json()
        onDataUpdate(data.candles || [])
        updateConnectionStatus('connected')
      } else {
        // Generate fallback candle data
        const fallbackCandles = generateFallbackCandles(symbol, interval)
        onDataUpdate(fallbackCandles)
        updateConnectionStatus('connected')
      }
    } catch (error) {
      console.error('Error fetching candle data:', error)
      updateConnectionStatus('disconnected')
      
      // Generate fallback data on error
      const fallbackCandles = generateFallbackCandles(symbol, interval)
      onDataUpdate(fallbackCandles)
    }
  }

  // Generate fallback candle data
  const generateFallbackCandles = (symbol: string, interval: string): CandleData[] => {
    const candles: CandleData[] = []
    const now = Date.now()
    const intervalMs = getIntervalMs(interval)
    const basePrice = getBasePriceForSymbol(symbol)
    
    for (let i = 99; i >= 0; i--) {
      const time = now - (i * intervalMs)
      const volatility = 0.02 // 2% volatility
      const change = (Math.random() - 0.5) * volatility
      const open = basePrice * (1 + change)
      const close = open * (1 + (Math.random() - 0.5) * volatility)
      const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5)
      const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5)
      const volume = Math.random() * 1000000 + 100000
      
      candles.push({
        time,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: Math.floor(volume),
        vwap: parseFloat(((high + low + close) / 3).toFixed(2))
      })
    }
    
    return candles
  }

  // Get interval in milliseconds
  const getIntervalMs = (interval: string): number => {
    const intervalMap: { [key: string]: number } = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000
    }
    return intervalMap[interval] || 60 * 60 * 1000
  }

  // Get base price for symbol
  const getBasePriceForSymbol = (symbol: string): number => {
    const priceMap: { [key: string]: number } = {
      'BTC/USD': 43000,
      'ETH/USD': 2650,
      'USD/AFN': 70.5,
      'EUR/AFN': 76.2,
      'GBP/AFN': 89.5,
      'PKR/AFN': 0.25,
      'GOLD': 2045,
      'SILVER': 24.5,
      'OIL': 78.2
    }
    return priceMap[symbol] || 100
  }

  // Initialize WebSocket connection for real-time data
  const initializeWebSocket = () => {
    if (!isRealTime) return

    try {
      // For demo purposes, we'll simulate WebSocket with intervals
      // In production, this would connect to a real WebSocket endpoint
      updateConnectionStatus('connecting')
      
      // Simulate connection delay
      setTimeout(() => {
        updateConnectionStatus('connected')
        retryCount.current = 0
        
        // Start real-time updates
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        
        intervalRef.current = setInterval(() => {
          if (isRealTime) {
            fetchCandleData(selectedAsset, timeframe)
            fetchMarketAssets()
          }
        }, 30000) // Update every 30 seconds
        
      }, 2000)
      
    } catch (error) {
      console.error('WebSocket connection error:', error)
      updateConnectionStatus('disconnected')
      
      // Retry connection
      if (retryCount.current < maxRetries) {
        retryCount.current++
        retryTimeoutRef.current = setTimeout(() => {
          initializeWebSocket()
        }, Math.pow(2, retryCount.current) * 1000) // Exponential backoff
      }
    }
  }

  // Cleanup function
  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
  }

  // Initialize data fetching
  useEffect(() => {
    updateConnectionStatus('connecting')
    
    // Initial data fetch
    fetchMarketAssets()
    fetchCandleData(selectedAsset, timeframe)
    
    // Initialize real-time updates if enabled
    if (isRealTime) {
      initializeWebSocket()
    } else {
      updateConnectionStatus('connected')
    }
    
    return cleanup
  }, [selectedAsset, timeframe, isRealTime])

  // Update data when asset or timeframe changes
  useEffect(() => {
    if (connectionStatus === 'connected') {
      fetchCandleData(selectedAsset, timeframe)
    }
  }, [selectedAsset, timeframe])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [])

  // This component doesn't render anything visible
  return null
}