import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentId = params.id
    const { title, type, content, url, position, isActive } = await request.json()

    if (!title || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    try {
      const contentItem = await prisma.contentItem.update({
        where: { id: contentId },
        data: {
          title,
          type,
          content: content || '',
          url: url || null,
          position: position || 'DASHBOARD',
          isActive: isActive !== false,
          updatedAt: new Date()
        }
      })

      // Log the action
      try {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'CONTENT_UPDATED',
            resource: 'CONTENT',
            resourceId: contentItem.id,
            details: `Updated content: ${title}`
          }
        })
      } catch (auditError) {
        console.warn('Failed to create audit log:', auditError)
      }

      return NextResponse.json(contentItem)
    } catch (dbError) {
      console.error('Database error in content update:', dbError)
      
      // Use fallback storage for updates
      const contentStorage = global.contentStorage || []
      const itemIndex = contentStorage.findIndex((item: any) => item.id === contentId)
      
      if (itemIndex === -1) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 })
      }
      
      const updatedItem = {
        ...contentStorage[itemIndex],
        title,
        type,
        content: content || '',
        url: url || null,
        position: position || 'DASHBOARD',
        isActive: isActive !== false,
        updatedAt: new Date().toISOString()
      }
      
      contentStorage[itemIndex] = updatedItem
      global.contentStorage = contentStorage
      
      return NextResponse.json(updatedItem)
    }
  } catch (error) {
    console.error('Content update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentId = params.id

    try {
      const contentItem = await prisma.contentItem.findUnique({
        where: { id: contentId },
        select: { title: true }
      })

      if (!contentItem) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 })
      }

      await prisma.contentItem.delete({
        where: { id: contentId }
      })

      // Log the action
      try {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'CONTENT_DELETED',
            resource: 'CONTENT',
            resourceId: contentId,
            details: `Deleted content: ${contentItem.title}`
          }
        })
      } catch (auditError) {
        console.warn('Failed to create audit log:', auditError)
      }

      return NextResponse.json({ success: true })
    } catch (dbError) {
      console.error('Database error in content deletion:', dbError)
      
      // Use fallback storage for deletion
      const contentStorage = global.contentStorage || []
      const itemIndex = contentStorage.findIndex((item: any) => item.id === contentId)
      
      if (itemIndex === -1) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 })
      }
      
      contentStorage.splice(itemIndex, 1)
      global.contentStorage = contentStorage
      
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Content deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentId = params.id

    try {
      const contentItem = await prisma.contentItem.findUnique({
        where: { id: contentId }
      })

      if (!contentItem) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 })
      }

      return NextResponse.json(contentItem)
    } catch (dbError) {
      console.error('Database error in content fetch:', dbError)
      
      // Use fallback storage
      const contentStorage = global.contentStorage || []
      const item = contentStorage.find((item: any) => item.id === contentId)
      
      if (!item) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 })
      }
      
      return NextResponse.json(item)
    }
  } catch (error) {
    console.error('Content fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}