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

    const contentItems = await prisma.contentItem.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(contentItems)
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

    return NextResponse.json(contentItem, { status: 201 })
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

    return NextResponse.json(contentItem)
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

    await prisma.contentItem.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Content deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    )
  }
}