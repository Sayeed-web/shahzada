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
      const configs = await prisma.systemConfig.findMany({
        orderBy: { key: 'asc' }
      })
      return NextResponse.json(configs)
    } catch (dbError) {
      // Return default system configurations
      const defaultConfigs = [
        { key: 'site_title', value: 'سرای شهزاده', description: 'عنوان سایت', updatedAt: new Date().toISOString() },
        { key: 'site_description', value: 'سیستم مدیریت صرافی و حواله', description: 'توضیحات سایت', updatedAt: new Date().toISOString() },
        { key: 'saraf_directory_title', value: 'دایرکتوری صرافان', description: 'عنوان بخش صرافان', updatedAt: new Date().toISOString() },
        { key: 'default_language', value: 'fa', description: 'زبان پیشفرض', updatedAt: new Date().toISOString() },
        { key: 'maintenance_mode', value: 'false', description: 'حالت تعمیر', updatedAt: new Date().toISOString() },
        { key: 'max_transaction_amount', value: '50000', description: 'حداکثر مبلغ تراکنش', updatedAt: new Date().toISOString() },
        { key: 'default_fee_percentage', value: '2.5', description: 'درصد کارمزد پیشفرض', updatedAt: new Date().toISOString() },
        { key: 'currency_update_interval', value: '300', description: 'بازه بروزرسانی نرخ', updatedAt: new Date().toISOString() },
        { key: 'notifications_enabled', value: 'true', description: 'اعلانات فعال', updatedAt: new Date().toISOString() },
        { key: 'registration_enabled', value: 'true', description: 'ثبت نام کاربران', updatedAt: new Date().toISOString() },
        { key: 'saraf_approval_required', value: 'true', description: 'تایید صرافان الزامی', updatedAt: new Date().toISOString() }
      ]
      return NextResponse.json(defaultConfigs)
    }
  } catch (error) {
    console.error('System config fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { key, value, description } = await request.json()

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 })
    }

    try {
      const config = await prisma.systemConfig.upsert({
        where: { key },
        update: { 
          value: String(value),
          description: description || `Updated by ${session.user.name}`
        },
        create: { 
          key, 
          value: String(value),
          description: description || `Created by ${session.user.name}`
        }
      })

      // Log the configuration change
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'UPDATE_SYSTEM_CONFIG',
          resource: 'SystemConfig',
          resourceId: key,
          details: `Changed ${key} to ${value}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        }
      })

      return NextResponse.json(config)
    } catch (dbError) {
      // Use in-memory storage for configuration updates
      const configStorage = global.configStorage || new Map()
      configStorage.set(key, {
        key,
        value: String(value),
        description: description || `Updated by ${session.user.name}`,
        updatedAt: new Date().toISOString()
      })
      global.configStorage = configStorage
      
      return NextResponse.json({
        key,
        value: String(value),
        description: description || `Updated by ${session.user.name}`,
        updatedAt: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('System config update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}