import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const source = searchParams.get('source')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {}
    
    if (category && category !== 'all') {
      whereClause.category = category
    }
    
    if (source && source !== 'all') {
      whereClause.source = source
    }
    
    if (dateFrom || dateTo) {
      whereClause.publishedAt = {}
      if (dateFrom) {
        whereClause.publishedAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        whereClause.publishedAt.lte = new Date(dateTo)
      }
    }

    try {
      // Try database first
      const [techNews, totalCount] = await Promise.all([
        prisma.techNews.findMany({
          where: whereClause,
          orderBy: { publishedAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            title: true,
            description: true,
            url: true,
            source: true,
            category: true,
            imageUrl: true,
            publishedAt: true,
            isActive: true,
            views: true,
            createdAt: true
          }
        }),
        prisma.techNews.count({ where: whereClause })
      ])

      const totalPages = Math.ceil(totalCount / limit)

      return NextResponse.json({
        news: techNews,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: {
          categories: await prisma.techNews.groupBy({
            by: ['category'],
            _count: { category: true }
          }),
          sources: await prisma.techNews.groupBy({
            by: ['source'],
            _count: { source: true }
          })
        }
      })

    } catch (dbError) {
      console.error('Database error, using fallback storage:', dbError)
      
      // Fallback to global storage
      const allNews = global.techNewsStorage || []
      
      // Apply filters
      let filteredNews = allNews.filter((news: any) => {
        if (category && category !== 'all' && news.category !== category) return false
        if (source && source !== 'all' && news.source !== source) return false
        
        if (dateFrom || dateTo) {
          const newsDate = new Date(news.publishedAt)
          if (dateFrom && newsDate < new Date(dateFrom)) return false
          if (dateTo && newsDate > new Date(dateTo)) return false
        }
        
        return true
      })

      // Sort by date
      filteredNews.sort((a: any, b: any) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )

      const totalCount = filteredNews.length
      const totalPages = Math.ceil(totalCount / limit)
      const paginatedNews = filteredNews.slice(skip, skip + limit)

      // Get unique categories and sources for filters
      const categories = [...new Set(allNews.map((news: any) => news.category))]
        .map(cat => ({ category: cat, _count: { category: allNews.filter((n: any) => n.category === cat).length } }))
      
      const sources = [...new Set(allNews.map((news: any) => news.source))]
        .map(src => ({ source: src, _count: { source: allNews.filter((n: any) => n.source === src).length } }))

      return NextResponse.json({
        news: paginatedNews,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: {
          categories,
          sources
        }
      })
    }

  } catch (error) {
    console.error('Tech news history fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      news: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
        hasNext: false,
        hasPrev: false
      }
    }, { status: 500 })
  }
}