'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, TrendingUp, BarChart3, Eye, EyeOff, X, Play, Pause, RefreshCw, Wifi, WifiOff, Star, Settings, Layers, Save } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { RealTradingView } from '@/components/charts/RealTradingView'
import { SimpleAssetSearch } from '@/components/charts/SimpleAssetSearch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface MarketAsset {
  symbol: string
  name: string
  type: 'crypto' | 'forex' | 'commodity' | 'stock' | 'index'
  category?: string
  exchange?: string
  price?: number
  change24h?: number
  changePercent24h?: number
  volume24h?: number
}

const CHART_TYPES = [
  { id: 'candlestick', name: 'Candlestick', icon: BarChart3 },
  { id: 'line', name: 'Line', icon: TrendingUp },
  { id: 'area', name: 'Area', icon: BarChart3 }
]

const TIMEFRAMES = [
  { id: '1m', name: '1m' },
  { id: '5m', name: '5m' },
  { id: '15m', name: '15m' },
  { id: '30m', name: '30m' },
  { id: '1h', name: '1H' },
  { id: '4h', name: '4H' },
  { id: '1d', name: '1D' },
  { id: '1w', name: '1W' }
]

const POPULAR_INDICATORS = [
  { id: 'volume', name: 'Volume', enabled: true },
  { id: 'rsi', name: 'RSI', enabled: false },
  { id: 'macd', name: 'MACD', enabled: false },
  { id: 'sma', name: 'SMA', enabled: false },
  { id: 'ema', name: 'EMA', enabled: false },
  { id: 'bollinger', name: 'Bollinger Bands', enabled: false }
]

export default function WorkingChartsPage() {
  const [selectedAsset, setSelectedAsset] = useState('BTCUSD')
  const [timeframe, setTimeframe] = useState('1h')
  const [chartType, setChartType] = useState('candlestick')
  const [indicators, setIndicators] = useState(POPULAR_INDICATORS)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [showAssetList, setShowAssetList] = useState(false)
  const [isRealTime, setIsRealTime] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected')
  const [favorites, setFavorites] = useState<string[]>([])
  const [selectedAssetData, setSelectedAssetData] = useState<MarketAsset | null>(null)

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('chartFavorites')
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites))
      } catch (error) {
        console.error('Error loading favorites:', error)
      }
    }
  }, [])

  const toggleFavorite = useCallback((symbol: string) => {
    const newFavorites = favorites.includes(symbol)
      ? favorites.filter(f => f !== symbol)
      : [...favorites, symbol]
    setFavorites(newFavorites)
    
    try {
      localStorage.setItem('chartFavorites', JSON.stringify(newFavorites))
    } catch (error) {
      console.error('Failed to save favorites:', error)
    }
  }, [favorites])

  // Mock asset data for selected asset
  useEffect(() => {
    const mockAssetData: MarketAsset = {
      symbol: selectedAsset,
      name: selectedAsset.replace('USD', ' / USD'),
      type: selectedAsset.includes('BTC') || selectedAsset.includes('ETH') ? 'crypto' : 'forex',
      exchange: selectedAsset.includes('BTC') || selectedAsset.includes('ETH') ? 'Binance' : 'Forex',
      price: Math.random() * 50000 + 1000,
      changePercent24h: (Math.random() - 0.5) * 10,
      volume24h: Math.random() * 1000000000
    }
    setSelectedAssetData(mockAssetData)
  }, [selectedAsset])

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] bg-gray-950 text-white flex">
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full">
          {/* Professional Top Bar */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900 h-16 flex-shrink-0">
            <div className="flex items-center space-x-4 overflow-hidden">
              {/* Asset Selector */}
              <button
                onClick={() => setShowAssetList(true)}
                className="flex items-center space-x-3 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 min-w-[200px] border border-gray-700 transition-all"
              >
                <Search className="w-5 h-5 text-gray-400" />
                <div className="text-left flex-1">
                  <div className="font-bold text-sm text-white">{selectedAsset}</div>
                  {selectedAssetData && (
                    <div className="text-xs text-gray-400 flex items-center justify-between">
                      <span>${selectedAssetData.price?.toLocaleString()}</span>
                      <span className={selectedAssetData.changePercent24h && selectedAssetData.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {selectedAssetData.changePercent24h && selectedAssetData.changePercent24h >= 0 ? '+' : ''}{selectedAssetData.changePercent24h?.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
                {favorites.includes(selectedAsset) && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
              </button>

              {/* Timeframe Selector */}
              <div className="flex space-x-1">
                {TIMEFRAMES.slice(0, 6).map((tf) => (
                  <button
                    key={tf.id}
                    onClick={() => setTimeframe(tf.id)}
                    className={`px-3 py-2 rounded text-sm font-medium transition-all border ${
                      timeframe === tf.id 
                        ? 'bg-blue-600 text-white border-blue-500' 
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                    }`}
                  >
                    {tf.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Connection Status */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-xs font-medium ${
                connectionStatus === 'connected' ? 'bg-green-900/50 text-green-300 border border-green-800' :
                connectionStatus === 'connecting' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-800' :
                'bg-red-900/50 text-red-300 border border-red-800'
              }`}>
                {connectionStatus === 'connected' && <Wifi className="w-3 h-3" />}
                {connectionStatus === 'connecting' && <RefreshCw className="w-3 h-3 animate-spin" />}
                {connectionStatus === 'disconnected' && <WifiOff className="w-3 h-3" />}
                <span className="capitalize">{connectionStatus}</span>
              </div>

              {/* Real-time Toggle */}
              <Button
                onClick={() => setIsRealTime(!isRealTime)}
                variant={isRealTime ? "default" : "outline"}
                size="sm"
                className="h-8"
              >
                {isRealTime ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {isRealTime ? 'Live' : 'Paused'}
              </Button>

              {/* Sidebar Toggle */}
              <Button
                onClick={() => setSidebarVisible(!sidebarVisible)}
                variant="outline"
                size="sm"
                className="h-8"
              >
                {sidebarVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="flex flex-1 h-full">
            {/* Professional Chart Area */}
            <div className="flex-1 bg-gray-950 relative p-4">
              <RealTradingView
                symbol={selectedAsset}
                interval={timeframe.toUpperCase()}
                theme="dark"
                height="calc(100vh - 12rem)"
              />
            </div>

            {/* Professional Tools Sidebar */}
            {sidebarVisible && (
              <div className="w-80 bg-gray-900 border-l border-gray-800 overflow-y-auto flex-shrink-0">
                <div className="p-4">
                  <Tabs defaultValue="tools" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="tools">Tools</TabsTrigger>
                      <TabsTrigger value="indicators">Studies</TabsTrigger>
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="tools" className="space-y-4">
                      {/* Chart Types */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Chart Type
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-3 gap-2">
                            {CHART_TYPES.map((type) => (
                              <button
                                key={type.id}
                                onClick={() => setChartType(type.id)}
                                className={`p-3 rounded-lg text-center transition-all border ${
                                  chartType === type.id 
                                    ? 'bg-blue-600 text-white border-blue-500' 
                                    : 'bg-gray-800 hover:bg-gray-700 border-gray-700'
                                }`}
                              >
                                <type.icon className="w-4 h-4 mx-auto mb-1" />
                                <div className="text-xs font-medium">{type.name}</div>
                              </button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Market Data */}
                      {selectedAssetData && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              Market Data
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">Price:</span>
                                <span className="font-mono font-bold">${selectedAssetData.price?.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">24h Change:</span>
                                <span className={`font-mono ${selectedAssetData.changePercent24h && selectedAssetData.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {selectedAssetData.changePercent24h && selectedAssetData.changePercent24h >= 0 ? '+' : ''}{selectedAssetData.changePercent24h?.toFixed(2)}%
                                </span>
                              </div>
                              {selectedAssetData.volume24h && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400">Volume:</span>
                                  <span className="font-mono text-xs">${(selectedAssetData.volume24h / 1e6).toFixed(1)}M</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">Exchange:</span>
                                <span className="text-xs font-medium">{selectedAssetData.exchange}</span>
                              </div>
                              <Button
                                onClick={() => toggleFavorite(selectedAsset)}
                                variant={favorites.includes(selectedAsset) ? "default" : "outline"}
                                size="sm"
                                className="w-full mt-3"
                              >
                                <Star className={`w-4 h-4 mr-2 ${favorites.includes(selectedAsset) ? 'fill-current' : ''}`} />
                                {favorites.includes(selectedAsset) ? 'Remove Favorite' : 'Add Favorite'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="indicators" className="space-y-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Technical Indicators
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            {indicators.map((indicator) => (
                              <button
                                key={indicator.id}
                                onClick={() => {
                                  setIndicators(prev => 
                                    prev.map(ind => 
                                      ind.id === indicator.id 
                                        ? { ...ind, enabled: !ind.enabled }
                                        : ind
                                    )
                                  )
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-sm transition-all border ${
                                  indicator.enabled 
                                    ? 'bg-green-600 text-white border-green-500' 
                                    : 'bg-gray-800 hover:bg-gray-700 border-gray-700'
                                }`}
                              >
                                <span className="font-medium">{indicator.name}</span>
                                <div className={`w-2 h-2 rounded-full ${indicator.enabled ? 'bg-white' : 'bg-gray-500'}`} />
                              </button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Chart Settings
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <Button variant="outline" size="sm" className="w-full">
                              <Save className="w-4 h-4 mr-2" />
                              Save Layout
                            </Button>
                            <Button variant="outline" size="sm" className="w-full">
                              <Layers className="w-4 h-4 mr-2" />
                              Load Layout
                            </Button>
                            <Button variant="outline" size="sm" className="w-full">
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Reset Chart
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Professional Asset Search Modal */}
        {showAssetList && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-gray-700">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">Select Trading Asset</h2>
                <button 
                  onClick={() => setShowAssetList(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              <div className="p-6">
                <SimpleAssetSearch
                  onAssetSelect={(asset) => {
                    setSelectedAsset(asset.symbol)
                    setShowAssetList(false)
                  }}
                  selectedAsset={selectedAsset}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}