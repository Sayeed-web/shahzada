import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = sanitizeInput(searchParams.get('status') || '')
    const type = sanitizeInput(searchParams.get('type') || '')

    const userId = session.user.id

    // Build where clause
    const where: any = { senderId: userId }
    
    if (status) {
      where.status = status
    }
    
    if (type) {
      where.type = type
    }

    // Get transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          saraf: {
            select: {
              businessName: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.transaction.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })

  } catch (error) {
    console.error('User transactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}