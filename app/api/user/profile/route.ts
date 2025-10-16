import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        lastLogin: true,
        saraf: {
          select: {
            id: true,
            businessName: true,
            businessAddress: true,
            businessPhone: true,
            status: true,
            rating: true,
            totalTransactions: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Sanitize inputs
    const updateData: any = {}
    
    if (body.name) {
      updateData.name = sanitizeInput(body.name)
    }
    
    if (body.phone) {
      updateData.phone = sanitizeInput(body.phone)
    }
    
    // Handle password change
    if (body.currentPassword && body.newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      })
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      
      const passwordMatch = await bcrypt.compare(body.currentPassword, user.password)
      if (!passwordMatch) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }
      
      updateData.password = await bcrypt.hash(body.newPassword, 12)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        updatedAt: true
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PROFILE_UPDATED',
        resource: 'USER',
        resourceId: session.user.id,
        details: JSON.stringify({
          updatedFields: Object.keys(updateData)
        })
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}