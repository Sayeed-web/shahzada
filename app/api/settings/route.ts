import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      // Get user settings (could be stored in a separate table)
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Default settings structure
      const settings = {
        user: {
          notifications: {
            email: true,
            push: false,
            sms: false,
            priceAlerts: true,
            newsUpdates: false
          },
          privacy: {
            profileVisible: true,
            activityVisible: false,
            dataSharing: false
          },
          preferences: {
            language: 'fa',
            currency: 'AFN',
            timezone: 'Asia/Kabul',
            dateFormat: 'persian'
          }
        },
        profile: user
      }

      return NextResponse.json(settings)

    } catch (dbError) {
      console.error('Database error in settings:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { profile, user: userSettings, system: systemSettings } = body

    try {
      // Update user profile if provided
      if (profile) {
        const updateData: any = {}
        
        if (profile.name) updateData.name = profile.name
        if (profile.phone) updateData.phone = profile.phone
        
        // Handle password change
        if (profile.newPassword && profile.currentPassword) {
          const bcrypt = require('bcryptjs')
          const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { password: true }
          })
          
          if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
          }
          
          const isValid = await bcrypt.compare(profile.currentPassword, user.password)
          if (!isValid) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
          }
          
          updateData.password = await bcrypt.hash(profile.newPassword, 12)
        }
        
        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: session.user.id },
            data: updateData
          })
        }
      }

      // Update system settings if user is admin
      if (systemSettings && session.user.role === 'ADMIN') {
        for (const [key, value] of Object.entries(systemSettings)) {
          await prisma.systemConfig.upsert({
            where: { key },
            update: { value: String(value) },
            create: {
              key,
              value: String(value),
              description: `Updated by ${session.user.name}`
            }
          })
        }
      }

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'SETTINGS_UPDATED',
          resource: 'USER_SETTINGS',
          resourceId: session.user.id,
          details: JSON.stringify({
            userSettings: !!userSettings,
            systemSettings: !!systemSettings
          })
        }
      })

      return NextResponse.json({ success: true })

    } catch (dbError) {
      console.error('Database error in settings update:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}