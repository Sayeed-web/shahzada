'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, DollarSign, TrendingUp } from 'lucide-react'

interface AdvancedTradingViewWidgetProps {
  symbol?: string
  onSymbolChange?: (symbol: string) => void
}

const SYMBOL_MAP: Record<string, string> = {
  'USDAFN': 'FX_IDC:USDAFN',
  'EURAFN': 'FX_IDC:EURAFN',
  'GBPAFN': 'FX_IDC:GBPAFN',
  'USDPKR': 'FX_IDC:USDPKR',
  'USDIRR': 'OANDA:USDIRR',
  'USDSAR': 'FX:USDSAR',
  'USDAED': 'FX:USDAED',
  'USDIQD': 'FX_IDC:USDIQD',
  'USDTRY': 'FX:USDTRY',
  'USDEGP': 'FX:USDEGP',
  'USDJOD': 'FX_IDC:USDJOD',
  'USDKWD': 'FX:USDKWD',
  'USDOMR': 'FX:USDOMR',
  'USDQAR': 'FX:USDQAR',
  'USDBHD': 'FX:USDBHD',
  'BTCUSD': 'BINANCE:BTCUSDT',
  'ETHUSD': 'BINANCE:ETHUSDT',
  'XAUUSD': 'TVC:GOLD',
  'XAGUSD': 'TVC:SILVER',
  'EURUSD': 'FX:EURUSD',
  'GBPUSD': 'FX:GBPUSD',
  'USDJPY': 'FX:USDJPY',
  'AUDUSD': 'FX:AUDUSD',
  'USDCAD': 'FX:USDCAD',
  'USDCHF': 'FX:USDCHF'
}

const QUICK_SYMBOLS = [
  { label: 'USD/AFN', value: 'USDAFN', icon: DollarSign, desc: 'Dollar to Afghani' },
  { label: 'USD/PKR', value: 'USDPKR', icon: DollarSign, desc: 'Dollar to Rupee' },
  { label: 'USD/IRR', value: 'USDIRR', icon: DollarSign, desc: 'Dollar to Rial' },
  { label: 'USD/SAR', value: 'USDSAR', icon: DollarSign, desc: 'Dollar to Riyal' },
  { label: 'USD/AED', value: 'USDAED', icon: DollarSign, desc: 'Dollar to Dirham' },
  { label: 'EUR/USD', value: 'EURUSD', icon: DollarSign, desc: 'Euro to Dollar' },
  { label: 'BTC', value: 'BTCUSD', icon: TrendingUp, desc: 'Bitcoin' },
  { label: 'Gold', value: 'XAUUSD', icon: TrendingUp, desc: 'Gold' }
]

export function AdvancedTradingViewWidget({ symbol = 'BTCUSD', onSymbolChange }: AdvancedTradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentSymbol, setCurrentSymbol] = useState(symbol)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return

    const tvSymbol = SYMBOL_MAP[currentSymbol] || 'BINANCE:BTCUSDT'
    
    containerRef.current.innerHTML = ''

    const widgetContainer = document.createElement('div')
    widgetContainer.className = 'tradingview-widget-container'
    widgetContainer.style.height = '100%'
    widgetContainer.style.width = '100%'

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    widgetDiv.style.height = '100%'
    widgetDiv.style.width = '100%'

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: '60',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      hide_side_toolbar: false,
      support_host: 'https://www.tradingview.com',
      studies: [
        'MASimple@tv-basicstudies',
        'RSI@tv-basicstudies'
      ],
      show_popup_button: true,
      popup_width: '1000',
      popup_height: '650'
    })

    widgetContainer.appendChild(widgetDiv)
    widgetContainer.appendChild(script)
    containerRef.current.appendChild(widgetContainer)

    script.onload = () => setTimeout(() => setIsLoading(false), 1500)
    script.onerror = () => setIsLoading(false)

  }, [currentSymbol])

  const handleSymbolSelect = (sym: string) => {
    setCurrentSymbol(sym)
    onSymbolChange?.(sym)
  }

  const handleSearch = () => {
    if (searchTerm.trim()) {
      handleSymbolSelect(searchTerm.toUpperCase())
      setSearchTerm('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-2 flex-1 min-w-[150px] sm:min-w-[200px] relative">
          <Input
            placeholder="Search: USDAFN, EURUSD, BTCUSD, XAUUSD..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            list="currency-suggestions"
          />
          <datalist id="currency-suggestions">
            <option value="USDAFN">🇦🇫 USD/AFN - Dollar to Afghani</option>
            <option value="EURAFN">🇦🇫 EUR/AFN - Euro to Afghani</option>
            <option value="GBPAFN">🇦🇫 GBP/AFN - Pound to Afghani</option>
            <option value="USDPKR">🇵🇰 USD/PKR - Dollar to Pakistani Rupee</option>
            <option value="USDIRR">🇮🇷 USD/IRR - Dollar to Iranian Rial</option>
            <option value="USDSAR">🇸🇦 USD/SAR - Dollar to Saudi Riyal</option>
            <option value="USDAED">🇦🇪 USD/AED - Dollar to UAE Dirham</option>
            <option value="USDIQD">🇮🇶 USD/IQD - Dollar to Iraqi Dinar</option>
            <option value="USDTRY">🇹🇷 USD/TRY - Dollar to Turkish Lira</option>
            <option value="USDEGP">🇪🇬 USD/EGP - Dollar to Egyptian Pound</option>
            <option value="USDJOD">🇯🇴 USD/JOD - Dollar to Jordanian Dinar</option>
            <option value="USDKWD">🇰🇼 USD/KWD - Dollar to Kuwaiti Dinar</option>
            <option value="USDOMR">🇴🇲 USD/OMR - Dollar to Omani Rial</option>
            <option value="USDQAR">🇶🇦 USD/QAR - Dollar to Qatari Riyal</option>
            <option value="USDBHD">🇧🇭 USD/BHD - Dollar to Bahraini Dinar</option>
            <option value="EURUSD">💶 EUR/USD - Euro to Dollar</option>
            <option value="GBPUSD">💷 GBP/USD - Pound to Dollar</option>
            <option value="USDJPY">💴 USD/JPY - Dollar to Yen</option>
            <option value="AUDUSD">🇦🇺 AUD/USD - Australian Dollar</option>
            <option value="USDCAD">🇨🇦 USD/CAD - Dollar to Canadian Dollar</option>
            <option value="USDCHF">🇨🇭 USD/CHF - Dollar to Swiss Franc</option>
            <option value="BTCUSD">₿ BTC/USD - Bitcoin</option>
            <option value="ETHUSD">Ξ ETH/USD - Ethereum</option>
            <option value="XAUUSD">🥇 XAU/USD - Gold</option>
            <option value="XAGUSD">🥈 XAG/USD - Silver</option>
          </datalist>
          <Button onClick={handleSearch} size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {QUICK_SYMBOLS.map((sym) => (
            <Button
              key={sym.value}
              variant={currentSymbol === sym.value ? 'default' : 'outline'}
              size="sm"
              className="text-xs sm:text-sm px-2 sm:px-3"
              onClick={() => handleSymbolSelect(sym.value)}
              className="gap-1"
            >
              <sym.icon className="h-3 w-3" />
              {sym.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[700px] bg-[#131722] rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-[#131722] flex items-center justify-center z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-white">Loading chart...</p>
            </div>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  )
}
