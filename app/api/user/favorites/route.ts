import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const favorites = await prisma.$queryRaw`
      SELECT s.*, u.name as ownerName
      FROM sarafs s
      INNER JOIN users u ON s.userId = u.id
      WHERE s.id IN (
        SELECT JSON_EXTRACT(data, '$.sarafId') 
        FROM notifications 
        WHERE userId = ${session.user.id} 
        AND action = 'FAVORITE_SARAF'
      )
      AND s.status = 'APPROVED'
      AND s.isActive = 1
    `

    return NextResponse.json({ favorites })

  } catch (error) {
    console.error('Get favorites error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sarafId } = await request.json()
    
    if (!sarafId) {
      return NextResponse.json({ error: 'Saraf ID required' }, { status: 400 })
    }

    const sanitizedSarafId = sanitizeInput(sarafId)

    const saraf = await prisma.saraf.findUnique({
      where: { id: sanitizedSarafId }
    })

    if (!saraf) {
      return NextResponse.json({ error: 'Saraf not found' }, { status: 404 })
    }

    const existing = await prisma.notification.findFirst({
      where: {
        userId: session.user.id,
        action: 'FAVORITE_SARAF',
        resourceId: sanitizedSarafId
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'Already in favorites' }, { status: 400 })
    }

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: 'صراف به علاقه‌مندی‌ها اضافه شد',
        message: `${saraf.businessName} به لیست علاقه‌مندی‌های شما اضافه شد`,
        type: 'info',
        action: 'FAVORITE_SARAF',
        resource: 'SARAF',
        resourceId: sanitizedSarafId,
        data: JSON.stringify({ sarafId: sanitizedSarafId }),
        read: true
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Add favorite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sarafId = sanitizeInput(searchParams.get('sarafId') || '')
    
    if (!sarafId) {
      return NextResponse.json({ error: 'Saraf ID required' }, { status: 400 })
    }

    await prisma.notification.deleteMany({
      where: {
        userId: session.user.id,
        action: 'FAVORITE_SARAF',
        resourceId: sarafId
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Remove favorite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
