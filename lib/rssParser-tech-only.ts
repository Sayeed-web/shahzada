import { XMLParser } from 'fast-xml-parser'

interface RSSItem {
  title: string
  description?: string
  content?: string
  link: string
  pubDate: string
  'media:content'?: {
    '@_url': string
  }
  enclosure?: {
    '@_url': string
  }
  image?: string
}

interface RSSFeed {
  rss: {
    channel: {
      title: string
      description: string
      item: RSSItem[]
    }
  }
}

function extractImageFromContent(item: any): string | null {
  try {
    // Check media:content
    if (item['media:content']?.['@_url']) return item['media:content']['@_url']
    if (item['media:thumbnail']?.['@_url']) return item['media:thumbnail']['@_url']
    
    // Check enclosure
    if (item.enclosure?.['@_url'] && item.enclosure?.['@_type']?.includes('image')) {
      return item.enclosure['@_url']
    }
    
    // Extract from description/content HTML
    const content = item.description || item.content || item['content:encoded'] || ''
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i)
    if (imgMatch?.[1]) return imgMatch[1]
    
    // Check for og:image in content
    const ogMatch = content.match(/og:image["']\s*content=["']([^"']+)["']/i)
    if (ogMatch?.[1]) return ogMatch[1]
    
    return null
  } catch {
    return null
  }
}

export async function fetchRSSFeed(url: string, source: string): Promise<any[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'Cache-Control': 'no-cache'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) return []
    
    const xmlText = await response.text()
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseTagValue: false,
      trimValues: true
    })
    
    const result: RSSFeed = parser.parse(xmlText)
    const items = Array.isArray(result.rss?.channel?.item) 
      ? result.rss.channel.item 
      : result.rss?.channel?.item ? [result.rss.channel.item] : []
    
    return items.slice(0, 10).map((item, index) => {
      const extractedImage = extractImageFromContent(item)
      return {
        id: `${source.replace(/\s+/g, '-')}-${Date.now()}-${index}`,
        title: (item.title || 'بدون عنوان').trim(),
        description: item.description ? item.description.replace(/<[^>]*>/g, '').trim().substring(0, 300) : '',
        content: item.content || item.description || '',
        url: item.link || '',
        source: source,
        category: 'technology',
        language: 'fa',
        imageUrl: extractedImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200',
        publishedAt: new Date(item.pubDate || Date.now()).toISOString(),
        isActive: true,
        views: Math.floor(Math.random() * 2000) + 500
      }
    })
  } catch (error) {
    return []
  }
}

export async function fetchAllPersianTechNews(): Promise<any[]> {
  const sources = [
    { name: 'زومیت', url: 'https://www.zoomit.ir/feed/' },
    { name: 'دیجیکالا مگ', url: 'https://www.digikala.com/mag/feed/' },
    { name: 'ارز دیجیتال', url: 'https://www.arzdigital.com/feed/' }
  ]
  
  const allNews: any[] = []
  
  const fetchPromises = sources.map(async (source) => {
    try {
      const news = await fetchRSSFeed(source.url, source.name)
      if (news.length > 0) {
        console.log(`✅ ${source.name}: ${news.length} tech articles`)
      }
      return news
    } catch (error) {
      return []
    }
  })
  
  const results = await Promise.allSettled(fetchPromises)
  
  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      allNews.push(...result.value)
    }
  })
  
  return allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, 30)
}
