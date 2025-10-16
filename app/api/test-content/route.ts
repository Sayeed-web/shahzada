import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const count = await prisma.contentItem.count()
    const items = await prisma.contentItem.findMany({
      select: { id: true, title: true, isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    
    return NextResponse.json({
      success: true,
      count,
      items,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    })
  }
}