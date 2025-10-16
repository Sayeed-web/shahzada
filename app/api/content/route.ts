import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Clear any global cache first
    if (global.contentStorage) {
      delete global.contentStorage
    }
    
    // Force fresh database query with no caching
    const contentItems = await prisma.contentItem.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('Content API called, found items:', contentItems.length)
    console.log('Content items:', contentItems.map(item => ({ id: item.id, title: item.title, isActive: item.isActive })))
    
    return NextResponse.json(contentItems, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString(),
        'ETag': `"${Date.now()}"`
      }
    })
  } catch (error) {
    console.error('Content fetch error:', error)
    return NextResponse.json([], { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    })
  }
}