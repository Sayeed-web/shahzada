import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Force fresh database query
    const contentItems = await prisma.contentItem.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('Content API called, found items:', contentItems.length)
    
    return NextResponse.json(contentItems, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString()
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