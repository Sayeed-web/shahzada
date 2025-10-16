import { NextRequest, NextResponse } from 'next/server'

interface LinkPreview {
  title: string
  description: string
  image: string
  url: string
  siteName: string
  type: string
  favicon: string
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Fetch the webpage
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(validUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 })
    }

    const html = await response.text()
    
    // Extract metadata using regex (simpler than JSDOM)
    const getMetaContent = (property: string): string => {
      const patterns = [
        new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*?)["']`, 'i'),
        new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*?)["']`, 'i'),
        new RegExp(`<meta[^>]*content=["']([^"']*?)["'][^>]*property=["']${property}["']`, 'i'),
        new RegExp(`<meta[^>]*content=["']([^"']*?)["'][^>]*name=["']${property}["']`, 'i')
      ]
      
      for (const pattern of patterns) {
        const match = html.match(pattern)
        if (match && match[1]) return match[1]
      }
      return ''
    }

    const getTitleFromHtml = (): string => {
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
      return titleMatch ? titleMatch[1].trim() : ''
    }

    const title = getMetaContent('og:title') || 
                  getMetaContent('twitter:title') ||
                  getTitleFromHtml() || 
                  validUrl.hostname

    const description = getMetaContent('og:description') || 
                       getMetaContent('twitter:description') ||
                       getMetaContent('description') || 
                       ''

    let image = getMetaContent('og:image') || getMetaContent('twitter:image')
    
    // Make image URL absolute if it's relative
    if (image && !image.startsWith('http')) {
      try {
        image = new URL(image, validUrl.origin).toString()
      } catch {
        image = ''
      }
    }

    const siteName = getMetaContent('og:site_name') || validUrl.hostname
    const type = getMetaContent('og:type') || 'website'
    const favicon = `${validUrl.origin}/favicon.ico`

    const preview: LinkPreview = {
      title: title.trim(),
      description: description.trim(),
      image: image,
      url: validUrl.toString(),
      siteName: siteName.trim(),
      type: type,
      favicon: favicon
    }

    return NextResponse.json(preview)

  } catch (error) {
    console.error('Link preview error:', error)
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 })
  }
}