import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Add sample content items
    const content1 = await prisma.contentItem.upsert({
      where: { id: 'content-1' },
      update: {},
      create: {
        id: 'content-1',
        title: 'نرخ ارز امروز',
        content: 'آخرین نرخهای ارز در بازار کابل و سایر شهرهای افغانستان',
        type: 'ANNOUNCEMENT',
        position: 'DASHBOARD',
        isActive: true
      }
    })

    const content2 = await prisma.contentItem.upsert({
      where: { id: 'content-2' },
      update: {},
      create: {
        id: 'content-2',
        title: 'خدمات حواله',
        content: 'ارسال و دریافت حواله به تمام نقاط افغانستان و جهان',
        type: 'ANNOUNCEMENT',
        position: 'DASHBOARD',
        isActive: true
      }
    })

    const content3 = await prisma.contentItem.upsert({
      where: { id: 'content-3' },
      update: {},
      create: {
        id: 'content-3',
        title: 'راهنمای استفاده',
        content: 'نحوه استفاده از سیستم سرای شهزاده و خدمات آن',
        type: 'ANNOUNCEMENT',
        position: 'DASHBOARD',
        isActive: true
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Content added successfully!',
      content: [content1, content2, content3]
    })
  } catch (error) {
    console.error('Content error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to add content',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}