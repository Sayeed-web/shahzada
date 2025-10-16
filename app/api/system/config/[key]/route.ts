import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_CONFIGS: Record<string, string> = {
  'saraf_directory_title': 'صرافان معتبر',
  'site_title': 'سرای شهزاده',
  'site_description': 'پلتفورم جامع مالی برای افغانستان',
  'default_language': 'fa',
  'maintenance_mode': 'false',
  'notifications_enabled': 'true',
  'registration_enabled': 'true',
  'saraf_approval_required': 'true',
  'max_transaction_amount': '50000',
  'default_fee_percentage': '2.5',
  'currency_update_interval': '300'
}

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const key = params.key
    
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key }
      })

      if (config) {
        return NextResponse.json(config)
      }
    } catch (dbError) {
      console.warn('Database error, using defaults:', dbError)
    }

    // Return default value
    const defaultValue = DEFAULT_CONFIGS[key] || ''
    return NextResponse.json({
      key,
      value: defaultValue,
      description: `Default value for ${key}`
    })
    
  } catch (error) {
    console.error('System config fetch error:', error)
    
    // Always return a default response to prevent 500 errors
    const key = params?.key || 'unknown'
    return NextResponse.json({
      key,
      value: DEFAULT_CONFIGS[key] || '',
      description: `Fallback value for ${key}`
    })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const key = params.key
    const { value, description } = await request.json()
    
    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 })
    }

    try {
      const config = await prisma.systemConfig.upsert({
        where: { key },
        update: { 
          value: String(value), 
          description: description || null,
          updatedAt: new Date()
        },
        create: { 
          key, 
          value: String(value), 
          description: description || null 
        }
      })

      return NextResponse.json(config)
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 })
    }
    
  } catch (error) {
    console.error('System config update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}