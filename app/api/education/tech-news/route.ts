import { NextRequest, NextResponse } from 'next/server'
import { fetchAllPersianTechNews } from '@/lib/rssParser-tech-only'

const sampleTechNews = [
  {
    id: '1',
    title: 'بیت کوین به بالاترین قیمت خود رسید',
    description: 'بازار ارزهای دیجیتال شاهد رشد چشمگیری در قیمت بیت کوین بوده و تحلیلگران انتظار رشد بیشتر را دارند',
    url: 'https://www.zoomit.ir',
    source: 'زومیت',
    category: 'technology',
    imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=200&fit=crop',
    publishedAt: new Date().toISOString(),
    views: 1250,
    isActive: true
  },
  {
    id: '2',
    title: 'فناوری بلاکچین در ایران',
    description: 'بررسی کاربردهای فناوری بلاکچین در صنعت مالی و بانکی ایران و چشم‌انداز آینده آن',
    url: 'https://www.digikala.com/mag',
    source: 'دیجیکالا مگ',
    category: 'technology',
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop',
    publishedAt: new Date().toISOString(),
    views: 890,
    isActive: true
  },
  {
    id: '3',
    title: 'هوش مصنوعی در خدمات مالی',
    description: 'چگونه هوش مصنوعی در حال تغییر چهره خدمات مالی و بانکی است',
    url: 'https://www.zoomit.ir',
    source: 'زومیت',
    category: 'technology',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop',
    publishedAt: new Date().toISOString(),
    views: 1120,
    isActive: true
  },
  {
    id: '4',
    title: 'آینده پرداخت‌های دیجیتال',
    description: 'بررسی روندهای جدید در پرداخت‌های دیجیتال و تأثیر آن بر زندگی روزمره',
    url: 'https://www.arzdigital.com',
    source: 'ارز دیجیتال',
    category: 'technology',
    imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=200&fit=crop',
    publishedAt: new Date().toISOString(),
    views: 950,
    isActive: true
  },
  {
    id: '5',
    title: 'امنیت سایبری در دنیای کریپتو',
    description: 'نکات کلیدی برای حفظ امنیت دارایی‌های دیجیتال و جلوگیری از حملات سایبری',
    url: 'https://www.arzdigital.com',
    source: 'ارز دیجیتال',
    category: 'technology',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=200&fit=crop',
    publishedAt: new Date().toISOString(),
    views: 1340,
    isActive: true
  },
  {
    id: '6',
    title: 'رشد استارت‌آپ‌های فینتک',
    description: 'بررسی رشد چشمگیر استارت‌آپ‌های فینتک در خاورمیانه و فرصت‌های سرمایه‌گذاری',
    url: 'https://www.digikala.com/mag',
    source: 'دیجیکالا مگ',
    category: 'technology',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=200&fit=crop',
    publishedAt: new Date().toISOString(),
    views: 780,
    isActive: true
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '10')
    const refresh = searchParams.get('refresh') === 'true'

    if (refresh) {
      try {
        const freshNews = await fetchAllPersianTechNews()
        if (freshNews.length > 0) {
          return NextResponse.json(freshNews.slice(0, limit))
        }
      } catch (rssError) {
        console.error('RSS fetch error:', rssError)
      }
    }

    let filteredNews = [...sampleTechNews]
    
    if (category && category !== 'all') {
      filteredNews = filteredNews.filter(news => news.category === category)
    }
    
    return NextResponse.json(filteredNews.slice(0, limit))
  } catch (error) {
    console.error('Tech news fetch error:', error)
    return NextResponse.json(sampleTechNews.slice(0, 6))
  }
}

// Auto-refresh tech news every hour
setInterval(async () => {
  try {
    console.log('Auto-refreshing Persian tech news...')
    const freshNews = await fetchAllPersianTechNews()
    if (freshNews.length > 0) {
      global.techNewsStorage = freshNews
      console.log(`Auto-refreshed ${freshNews.length} news articles`)
    }
  } catch (error) {
    console.error('Auto-refresh error:', error)
  }
}, 60 * 60 * 1000) // 1 hour