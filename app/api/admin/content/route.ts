import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const contentItems = await prisma.contentItem.findMany({
        orderBy: { createdAt: 'desc' }
      })
      
      console.log('Admin content fetch - found items:', contentItems.length)
      return NextResponse.json(contentItems, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
        }
      })
    } catch (dbError) {
      console.error('Database error, using fallback:', dbError)
      
      // Use fallback storage
      const contentStorage = global.contentStorage || []
      return NextResponse.json(contentStorage, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
        }
      })
    }
  } catch (error) {
    console.error('Admin content fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, type, content, url, position, isActive } = body

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 })
    }

    try {
      const contentItem = await prisma.contentItem.create({
        data: {
          title: title.trim(),
          type,
          content: content || '',
          url: url || null,
          position: position || 'DASHBOARD',
          isActive: isActive !== false
        }
      })

      // Create audit log
      try {
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'CONTENT_CREATED',
            resource: 'CONTENT',
            resourceId: contentItem.id,
            details: JSON.stringify({ title, type })
          }
        })
      } catch (auditError) {
        console.warn('Audit log failed:', auditError)
      }

      console.log('Content created:', contentItem.id, title)
      return NextResponse.json(contentItem, { status: 201 })
    } catch (dbError) {
      console.error('Database error, using fallback storage:', dbError)
      
      // Use fallback storage
      const contentStorage = global.contentStorage || []
      const newItem = {
        id: `temp_${Date.now()}`,
        title: title.trim(),
        type,
        content: content || '',
        url: url || null,
        position: position || 'DASHBOARD',
        isActive: isActive !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      contentStorage.unshift(newItem)
      global.contentStorage = contentStorage
      
      console.log('Content created in fallback:', newItem.id, title)
      return NextResponse.json(newItem, { status: 201 })
    }
  } catch (error) {
    console.error('Content creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, type, content, url, position, isActive } = body

    if (!id || !title || !type) {
      return NextResponse.json({ error: 'ID, title and type are required' }, { status: 400 })
    }

    try {
      const contentItem = await prisma.contentItem.update({
        where: { id },
        data: {
          title: title.trim(),
          type,
          content: content || '',
          url: url || null,
          position: position || 'DASHBOARD',
          isActive: isActive !== false,
          updatedAt: new Date()
        }
      })

      console.log('Content updated:', id, title)
      return NextResponse.json(contentItem)
    } catch (dbError) {
      console.error('Database error, using fallback storage:', dbError)
      
      // Use fallback storage
      const contentStorage = global.contentStorage || []
      const itemIndex = contentStorage.findIndex((item: any) => item.id === id)
      
      if (itemIndex === -1) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 })
      }
      
      const updatedItem = {
        ...contentStorage[itemIndex],
        title: title.trim(),
        type,
        content: content || '',
        url: url || null,
        position: position || 'DASHBOARD',
        isActive: isActive !== false,
        updatedAt: new Date().toISOString()
      }
      
      contentStorage[itemIndex] = updatedItem
      global.contentStorage = contentStorage
      
      console.log('Content updated in fallback:', id, title)
      return NextResponse.json(updatedItem)
    }
  } catch (error) {
    console.error('Content update error:', error)
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 })
    }

    try {
      await prisma.contentItem.delete({
        where: { id }
      })
      
      // Clear global cache
      if (global.contentStorage) {
        delete global.contentStorage
      }
      
      console.log('Content deleted from database:', id)
      return NextResponse.json({ success: true, deletedId: id })
    } catch (dbError) {
      console.error('Database error, using fallback storage:', dbError)
      
      // Use fallback storage
      const contentStorage = global.contentStorage || []
      const itemIndex = contentStorage.findIndex((item: any) => item.id === id)
      
      if (itemIndex === -1) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 })
      }
      
      contentStorage.splice(itemIndex, 1)
      global.contentStorage = contentStorage
      
      console.log('Content deleted from fallback:', id)
      return NextResponse.json({ success: true, deletedId: id })
    }
  } catch (error) {
    console.error('Content deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    )
  }
}