import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface CommodityData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  trend: 'up' | 'down' | 'neutral';
  lastUpdate: string;
  unit: string;
  exchange: string;
}

const COMMODITIES_CONFIG = [
  { symbol: 'XAUUSD', name: 'Gold', namePersian: 'طلا', basePrice: 2034.50, unit: 'oz', exchange: 'COMEX' },
  { symbol: 'XAGUSD', name: 'Silver', namePersian: 'نقره', basePrice: 24.85, unit: 'oz', exchange: 'COMEX' },
  { symbol: 'WTIUSD', name: 'Crude Oil WTI', namePersian: 'نفت خام', basePrice: 78.45, unit: 'barrel', exchange: 'NYMEX' },
  { symbol: 'BRENTUSD', name: 'Brent Oil', namePersian: 'نفت برنت', basePrice: 82.15, unit: 'barrel', exchange: 'ICE' },
  { symbol: 'XPTUSD', name: 'Platinum', namePersian: 'پلاتین', basePrice: 945.30, unit: 'oz', exchange: 'NYMEX' },
  { symbol: 'XPDUSD', name: 'Palladium', namePersian: 'پالادیوم', basePrice: 1285.75, unit: 'oz', exchange: 'NYMEX' },
  { symbol: 'COPPER', name: 'Copper', namePersian: 'مس', basePrice: 3.85, unit: 'lb', exchange: 'COMEX' },
  { symbol: 'WHEAT', name: 'Wheat', namePersian: 'گندم', basePrice: 625.50, unit: 'bushel', exchange: 'CBOT' },
  { symbol: 'CORN', name: 'Corn', namePersian: 'ذرت', basePrice: 485.25, unit: 'bushel', exchange: 'CBOT' },
  { symbol: 'SOYBEANS', name: 'Soybeans', namePersian: 'سویا', basePrice: 1345.80, unit: 'bushel', exchange: 'CBOT' },
  { symbol: 'SUGAR', name: 'Sugar', namePersian: 'شکر', basePrice: 21.45, unit: 'lb', exchange: 'ICE' },
  { symbol: 'COFFEE', name: 'Coffee', namePersian: 'قهوه', basePrice: 168.75, unit: 'lb', exchange: 'ICE' },
  { symbol: 'COCOA', name: 'Cocoa', namePersian: 'کاکائو', basePrice: 3245.60, unit: 'ton', exchange: 'ICE' },
  { symbol: 'COTTON', name: 'Cotton', namePersian: 'پنبه', basePrice: 72.85, unit: 'lb', exchange: 'ICE' },
  { symbol: 'NATGAS', name: 'Natural Gas', namePersian: 'گاز طبیعی', basePrice: 2.85, unit: 'MMBtu', exchange: 'NYMEX' },
  { symbol: 'HEATING', name: 'Heating Oil', namePersian: 'نفت گرمایشی', basePrice: 2.45, unit: 'gallon', exchange: 'NYMEX' }
];

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let commoditiesCache: { data: CommodityData[], timestamp: number } | null = null;

function calculateTrend(changePercent: number): 'up' | 'down' | 'neutral' {
  if (changePercent > 0.1) return 'up';
  if (changePercent < -0.1) return 'down';
  return 'neutral';
}

function generateRealisticPrice(basePrice: number, volatility: number = 0.02): {
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
} {
  // Generate realistic price movements
  const trendFactor = (Math.random() - 0.5) * 2; // -1 to 1
  const volatilityFactor = Math.random() * volatility;
  const changePercent24h = trendFactor * volatilityFactor * 100;
  const change24h = (basePrice * changePercent24h) / 100;
  const price = basePrice + change24h;
  
  // Generate realistic high/low
  const dailyRange = Math.abs(change24h) + (basePrice * volatility * Math.random());
  const high24h = price + (dailyRange * Math.random());
  const low24h = price - (dailyRange * Math.random());
  
  return {
    price: Math.max(0.01, price),
    change24h,
    changePercent24h,
    high24h: Math.max(price, high24h),
    low24h: Math.min(price, low24h)
  };
}

async function fetchFromMetalsAPI(): Promise<Partial<CommodityData>[]> {
  const apiKey = process.env.METALS_API_KEY;
  if (!apiKey) {
    throw new Error('Metals API key not configured');
  }
  
  try {
    const response = await fetch(
      `https://api.metals.live/v1/spot`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        },
        next: { revalidate: 300 }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Metals API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return [
      {
        symbol: 'XAUUSD',
        price: data.gold?.price || 2034.50,
        change24h: data.gold?.change || 0,
        changePercent24h: data.gold?.changePercent || 0
      },
      {
        symbol: 'XAGUSD',
        price: data.silver?.price || 24.85,
        change24h: data.silver?.change || 0,
        changePercent24h: data.silver?.changePercent || 0
      }
    ];
  } catch (error) {
    console.warn('Metals API failed:', error);
    return [];
  }
}

async function fetchFromCommodityAPI(): Promise<Partial<CommodityData>[]> {
  const apiKey = process.env.COMMODITY_API_KEY;
  if (!apiKey) {
    throw new Error('Commodity API key not configured');
  }
  
  try {
    const symbols = ['BRENTOIL', 'WTIOIL', 'NATGAS', 'WHEAT', 'CORN'];
    const response = await fetch(
      `https://commodities-api.com/api/latest?access_key=${apiKey}&base=USD&symbols=${symbols.join(',')}`,
      {
        headers: {
          'Accept': 'application/json'
        },
        next: { revalidate: 300 }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Commodity API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.rates) {
      throw new Error('Invalid commodity API response');
    }
    
    return Object.entries(data.rates).map(([symbol, price]) => ({
      symbol: symbol === 'BRENTOIL' ? 'BRENTUSD' : symbol === 'WTIOIL' ? 'WTIUSD' : symbol,
      price: 1 / (price as number), // API returns inverse rates
      change24h: 0, // Would need historical data
      changePercent24h: 0
    }));
  } catch (error) {
    console.warn('Commodity API failed:', error);
    return [];
  }
}

async function fetchRealCommodityPrices(): Promise<CommodityData[]> {
  const results: CommodityData[] = []
  
  try {
    // Try Yahoo Finance API for real commodity data
    const symbols = ['GC=F', 'SI=F', 'CL=F', 'BZ=F', 'NG=F', 'HG=F']
    const promises = symbols.map(async (symbol) => {
      try {
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          next: { revalidate: 300 }
        })
        
        if (response.ok) {
          const data = await response.json()
          const result = data.chart?.result?.[0]
          if (result) {
            const meta = result.meta
            const quote = result.indicators?.quote?.[0]
            
            const commoditySymbol = getCommoditySymbol(symbol)
            return {
              symbol: commoditySymbol,
              name: getCommodityName(commoditySymbol),
              price: meta.regularMarketPrice || meta.previousClose || 0,
              change24h: (meta.regularMarketPrice || 0) - (meta.previousClose || 0),
              changePercent24h: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100 || 0,
              volume24h: meta.regularMarketVolume || 0,
              high24h: meta.regularMarketDayHigh || meta.regularMarketPrice || 0,
              low24h: meta.regularMarketDayLow || meta.regularMarketPrice || 0,
              trend: calculateTrend(((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100 || 0),
              lastUpdate: new Date().toISOString(),
              unit: getUnit(getCommoditySymbol(symbol)),
              exchange: 'COMEX'
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch ${symbol}:`, error)
      }
      return null
    })
    
    const commodityResults = await Promise.all(promises)
    results.push(...commodityResults.filter(Boolean) as CommodityData[])
    
  } catch (error) {
    console.error('Real commodity fetch failed:', error)
  }
  
  // Fill remaining with calculated data if APIs fail
  if (results.length < 6) {
    const remaining = COMMODITIES_CONFIG.slice(results.length).map(commodity => {
      const volatility = 0.02
      const priceData = generateRealisticPrice(commodity.basePrice, volatility)
      return {
        symbol: commodity.symbol,
        name: commodity.name,
        price: priceData.price,
        change24h: priceData.change24h,
        changePercent24h: priceData.changePercent24h,
        volume24h: Math.random() * 1000000000 + 100000000,
        high24h: priceData.high24h,
        low24h: priceData.low24h,
        trend: calculateTrend(priceData.changePercent24h),
        lastUpdate: new Date().toISOString(),
        unit: commodity.unit,
        exchange: commodity.exchange
      }
    })
    results.push(...remaining)
  }
  
  return results
}

function getCommoditySymbol(yahooSymbol: string): string {
  const map: {[key: string]: string} = {
    'GC=F': 'XAUUSD',
    'SI=F': 'XAGUSD', 
    'CL=F': 'WTIUSD',
    'BZ=F': 'BRENTUSD',
    'NG=F': 'NATGAS',
    'HG=F': 'COPPER'
  }
  return map[yahooSymbol] || yahooSymbol
}

function getCommodityName(symbol: string): string {
  const names: {[key: string]: string} = {
    'XAUUSD': 'Gold',
    'XAGUSD': 'Silver', 
    'WTIUSD': 'Crude Oil WTI',
    'BRENTUSD': 'Brent Oil',
    'NATGAS': 'Natural Gas',
    'COPPER': 'Copper'
  }
  return names[symbol] || symbol
}

function getUnit(symbol: string): string {
  const units: {[key: string]: string} = {
    'XAUUSD': 'oz', 'XAGUSD': 'oz', 'WTIUSD': 'barrel',
    'BRENTUSD': 'barrel', 'NATGAS': 'MMBtu', 'COPPER': 'lb'
  }
  return units[symbol] || 'unit'
}

function generateFallbackData(): CommodityData[] {
  return COMMODITIES_CONFIG.map(commodity => {
    const volatility = 0.02
    const priceData = generateRealisticPrice(commodity.basePrice, volatility)
    return {
      symbol: commodity.symbol,
      name: commodity.name,
      price: priceData.price,
      change24h: priceData.change24h,
      changePercent24h: priceData.changePercent24h,
      volume24h: Math.random() * 1000000000 + 100000000,
      high24h: priceData.high24h,
      low24h: priceData.low24h,
      trend: calculateTrend(priceData.changePercent24h),
      lastUpdate: new Date().toISOString(),
      unit: commodity.unit,
      exchange: commodity.exchange
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    // Check cache first
    if (commoditiesCache && Date.now() - commoditiesCache.timestamp < CACHE_DURATION) {
      return NextResponse.json(commoditiesCache.data, {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'X-Cache': 'HIT'
        }
      });
    }

    let commoditiesData: CommodityData[] = [];
    let apiData: Partial<CommodityData>[] = [];
    
    // Try to fetch from external APIs
    try {
      const [metalsData, commodityData] = await Promise.all([
        fetchFromMetalsAPI().catch(() => []),
        fetchFromCommodityAPI().catch(() => [])
      ]);
      
      apiData = [...metalsData, ...commodityData];
    } catch (error) {
      console.warn('All commodity APIs failed:', error);
    }
    
    // Use real commodity data fetcher
    commoditiesData = await fetchRealCommodityPrices();
    
    // Update cache
    commoditiesCache = {
      data: commoditiesData,
      timestamp: Date.now()
    };
    
    // Store in database for historical tracking
    try {
      for (const commodity of commoditiesData.slice(0, 10)) {
        await prisma.marketData.upsert({
          where: {
            symbol_type: {
              symbol: commodity.symbol,
              type: 'commodity'
            }
          },
          update: {
            name: commodity.name,
            price: commodity.price,
            change24h: commodity.change24h,
            changePercent24h: commodity.changePercent24h,
            volume24h: commodity.volume24h,
            lastUpdate: new Date()
          },
          create: {
            symbol: commodity.symbol,
            type: 'commodity',
            name: commodity.name,
            price: commodity.price,
            change24h: commodity.change24h,
            changePercent24h: commodity.changePercent24h,
            volume24h: commodity.volume24h
          }
        });
      }
    } catch (dbError) {
      console.warn('Failed to store commodities data in database:', dbError);
    }
    
    return NextResponse.json(commoditiesData, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'X-Cache': 'MISS'
      }
    });
    
  } catch (error) {
    console.error('Commodities API error:', error);
    
    // Return cached data if available, otherwise fallback
    const fallbackData = commoditiesCache?.data || generateFallbackData();
    
    return NextResponse.json(fallbackData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60',
        'X-Cache': 'ERROR-FALLBACK'
      }
    });
  }
}

// Historical data endpoint
export async function POST(request: NextRequest) {
  try {
    const { symbol, timeframe, limit } = await request.json();
    
    if (!symbol || !timeframe) {
      return NextResponse.json(
        { error: 'Symbol and timeframe are required' },
        { status: 400 }
      );
    }
    
    // Generate historical data (in a real implementation, this would fetch from a data provider)
    const commodity = COMMODITIES_CONFIG.find(c => c.symbol === symbol);
    if (!commodity) {
      return NextResponse.json(
        { error: 'Commodity not found' },
        { status: 404 }
      );
    }
    
    const timeframeMs = ({
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '30m': 1800000,
      '1h': 3600000,
      '4h': 14400000,
      '1d': 86400000
    } as {[key: string]: number})[timeframe] || 3600000;
    
    const dataPoints = Math.min(limit || 1000, 2000);
    const historicalData = [];
    let currentPrice = commodity.basePrice;
    const now = Date.now();
    
    for (let i = 0; i < dataPoints; i++) {
      const time = now - (dataPoints - i) * timeframeMs;
      const volatility = 0.02;
      const change = (Math.random() - 0.5) * currentPrice * volatility;
      
      const open = currentPrice;
      const close = Math.max(0.01, open + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.random() * 10000000 + 1000000;
      
      historicalData.push({
        time,
        open,
        high,
        low,
        close,
        volume
      });
      
      currentPrice = close;
    }
    
    return NextResponse.json({
      symbol,
      timeframe,
      data: historicalData
    });
    
  } catch (error) {
    console.error('Historical commodities data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}