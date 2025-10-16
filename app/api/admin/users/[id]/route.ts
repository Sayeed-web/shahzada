import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = params.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        saraf: {
          include: {
            rates: true,
            transactions: {
              take: 10,
              orderBy: { createdAt: 'desc' }
            },
            branches: true
          }
        },
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        notifications: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        chatSessions: {
          include: {
            messages: {
              take: 5,
              orderBy: { timestamp: 'desc' }
            }
          }
        },
        _count: {
          select: {
            transactions: true,
            notifications: true,
            chatSessions: true,
            chatMessages: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)

  } catch (error) {
    console.error('Admin user fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = params.id
    const body = await request.json()

    // Prevent admin from modifying themselves in certain ways
    if (userId === session.user.id && body.isActive === false) {
      return NextResponse.json({ 
        error: 'Cannot deactivate your own account' 
      }, { status: 403 })
    }

    if (userId === session.user.id && body.role && body.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Cannot change your own role' 
      }, { status: 403 })
    }

    // Sanitize inputs
    const updateData: any = {}
    
    if (body.name !== undefined) {
      updateData.name = sanitizeInput(body.name)
    }
    
    if (body.email !== undefined) {
      updateData.email = sanitizeInput(body.email)
    }
    
    if (body.phone !== undefined) {
      updateData.phone = sanitizeInput(body.phone)
    }
    
    if (body.role !== undefined && ['USER', 'SARAF', 'ADMIN'].includes(body.role)) {
      updateData.role = body.role
    }
    
    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive)
    }

    if (body.isVerified !== undefined) {
      updateData.isVerified = Boolean(body.isVerified)
    }

    // Check if email is being changed and if it already exists
    if (updateData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: updateData.email,
          id: { not: userId }
        }
      })

      if (existingUser) {
        return NextResponse.json({ 
          error: 'Email already exists' 
        }, { status: 409 })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_UPDATED',
        resource: 'USER',
        resourceId: userId,
        details: JSON.stringify({
          changes: updateData,
          targetUser: updatedUser.email
        })
      }
    })

    // Create notification for user if their status changed
    if (updateData.isActive !== undefined) {
      await prisma.notification.create({
        data: {
          userId: userId,
          title: updateData.isActive ? 'حساب کاربری فعال شد' : 'حساب کاربری غیرفعال شد',
          message: updateData.isActive 
            ? 'حساب کاربری شما توسط مدیر سیستم فعال شد'
            : 'حساب کاربری شما توسط مدیر سیستم غیرفعال شد',
          type: updateData.isActive ? 'success' : 'warning',
          action: 'ACCOUNT_STATUS_CHANGE'
        }
      })
    }

    return NextResponse.json({
      success: true,
      user: updatedUser
    })

  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = params.id

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json({ 
        error: 'Cannot delete your own account' 
      }, { status: 403 })
    }

    // Check if user exists and is not another admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json({ 
        error: 'Cannot delete admin users' 
      }, { status: 403 })
    }

    // Delete related data first
    await prisma.chatMessage.deleteMany({
      where: { senderId: userId }
    })

    await prisma.chatSession.deleteMany({
      where: { userId: userId }
    })

    await prisma.notification.deleteMany({
      where: { userId: userId }
    })

    await prisma.transaction.deleteMany({
      where: { senderId: userId }
    })

    // Delete saraf data if exists
    await prisma.saraf.deleteMany({
      where: { userId: userId }
    })

    // Finally delete the user
    await prisma.user.delete({
      where: { id: userId }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_DELETED',
        resource: 'USER',
        resourceId: userId,
        details: JSON.stringify({
          deletedUser: {
            email: user.email,
            name: user.name,
            role: user.role
          }
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('User deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}