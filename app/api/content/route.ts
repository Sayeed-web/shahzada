import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timestamp = searchParams.get('_t')
    const random = searchParams.get('_r')
    
    console.log(`Content API called at ${timestamp} with random ${random}`)
    
    // Clear any global cache first
    if (global.contentStorage) {
      delete global.contentStorage
    }
    
    try {
      // Force fresh database query with no caching
      const contentItems = await prisma.contentItem.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      })
      
      console.log('Content API - found items:', contentItems.length)
      
      return NextResponse.json(contentItems, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, private',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Last-Modified': new Date().toUTCString(),
          'ETag': `"${Date.now()}-${Math.random()}"`,
          'Vary': 'Accept-Encoding',
          'X-Content-Type-Options': 'nosniff'
        }
      })
    } catch (dbError) {
      console.error('Database error, using fallback:', dbError)
      
      // Use fallback storage
      const contentStorage = global.contentStorage || []
      return NextResponse.json(contentStorage, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, private',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }
  } catch (error) {
    console.error('Content fetch error:', error)
    return NextResponse.json([], { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, private',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}