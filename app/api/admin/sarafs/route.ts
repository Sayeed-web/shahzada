import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = sanitizeInput(searchParams.get('search') || '')
    const status = sanitizeInput(searchParams.get('status') || '')

    const skip = (page - 1) * limit

    try {
      // Build where clause
      const where: any = {}
      if (search) {
        where.OR = [
          { businessName: { contains: search, mode: 'insensitive' } },
          { businessPhone: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } }
        ]
      }
      if (status && status !== 'ALL') {
        where.status = status
      }

      const [sarafs, total] = await Promise.all([
        prisma.saraf.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isActive: true,
                createdAt: true,
                lastLogin: true
              }
            },
            _count: {
              select: {
                transactions: true,
                rates: true,
                documents: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.saraf.count({ where })
      ])

      return NextResponse.json({
        sarafs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (dbError) {
      console.error('Database error in admin sarafs:', dbError)
      
      // Return error instead of fake data
      return NextResponse.json({
        error: 'Database connection failed',
        sarafs: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      }, { status: 503 })
    }

  } catch (error) {
    console.error('Admin sarafs fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}