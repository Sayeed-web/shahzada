import { NextRequest, NextResponse } from 'next/server'
import { sanitizeInput, validateNumericInput } from '@/lib/security'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const from = sanitizeInput(searchParams.get('from') || '').toUpperCase()
  const to = sanitizeInput(searchParams.get('to') || '').toUpperCase()
  const amountStr = sanitizeInput(searchParams.get('amount') || '')
  const amount = validateNumericInput(amountStr)

  if (!from || !to || amount === null || amount <= 0) {
    return NextResponse.json(
      { error: 'Invalid parameters' },
      { status: 400 }
    )
  }

  try {
    // If same currency, return same amount
    if (from === to) {
      return NextResponse.json({
        from,
        to,
        amount: amount,
        result: amount,
        rate: 1
      })
    }

    let rate = 1
    
    // Try to get rate from external APIs
    try {
      // Try ExchangeRate-API first
      if (from === 'USD' || to === 'USD') {
        const base = from === 'USD' ? 'USD' : to
        const target = from === 'USD' ? to : from
        
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`)
        if (response.ok) {
          const data = await response.json()
          if (data.rates && data.rates[target]) {
            rate = from === 'USD' ? data.rates[target] : 1 / data.rates[from]
          }
        }
      } else {
        // For non-USD pairs, convert through USD
        const [fromResponse, toResponse] = await Promise.all([
          fetch(`https://api.exchangerate-api.com/v4/latest/${from}`),
          fetch(`https://api.exchangerate-api.com/v4/latest/USD`)
        ])
        
        if (fromResponse.ok && toResponse.ok) {
          const [fromData, toData] = await Promise.all([
            fromResponse.json(),
            toResponse.json()
          ])
          
          if (fromData.rates?.USD && toData.rates?.[to]) {
            rate = fromData.rates.USD * toData.rates[to]
          }
        }
      }
    } catch (error) {
      console.error('Primary API error:', error)
      
      // Try CurrencyLayer as backup
      try {
        const response = await fetch(
          `http://apilayer.net/api/live?access_key=ca682fec9053e48956509f6f4e85721c&currencies=${to}&source=${from}&format=1`
        )
        
        if (response.ok) {
          const data = await response.json()
          if (data.quotes && data.quotes[`${from}${to}`]) {
            rate = data.quotes[`${from}${to}`]
          }
        }
      } catch (backupError) {
        console.error('Backup API error:', backupError)
        
        // Fallback rates
        const fallbackRates: { [key: string]: number } = {
          'USD-AFN': 70.85,
          'EUR-AFN': 75.20,
          'GBP-AFN': 88.50,
          'PKR-AFN': 0.25,
          'IRR-AFN': 0.0017,
          'AFN-USD': 1 / 70.85,
          'AFN-EUR': 1 / 75.20,
          'USD-EUR': 0.85,
          'EUR-USD': 1.18,
          'USD-GBP': 0.73,
          'GBP-USD': 1.37,
          'BTC-USD': 43250,
          'ETH-USD': 2680,
          'USD-BTC': 1 / 43250,
          'USD-ETH': 1 / 2680
        }
        
        rate = fallbackRates[`${from}-${to}`] || 1
      }
    }

    const result = amount * rate

    return NextResponse.json({
      from,
      to,
      amount: amount,
      result: Math.round(result * 10000) / 10000, // Round to 4 decimal places
      rate: Math.round(rate * 10000) / 10000
    })
    
  } catch (error) {
    console.error('Conversion error:', error)
    return NextResponse.json(
      { error: 'Conversion failed' },
      { status: 500 }
    )
  }
}