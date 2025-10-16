import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Math.min(100, parseInt(searchParams.get('page') || '1')))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10')))
    const search = sanitizeInput(searchParams.get('search') || '').substring(0, 50)
    const role = sanitizeInput(searchParams.get('role') || '').substring(0, 10)

    const skip = (page - 1) * limit

    try {
      // Build where clause
      const where: any = {}
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      }
      if (role && role !== 'ALL') {
        where.role = role
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
            lastLogin: true,
            saraf: {
              select: {
                id: true,
                businessName: true,
                status: true,
                rating: true
              }
            },
            _count: {
              select: {
                transactions: true,
                notifications: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ])

      return NextResponse.json({
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (dbError) {
      console.error('Database error in admin users:', dbError)
      
      console.error('Database error in admin users:', dbError)
      return NextResponse.json({
        users: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      })
    }

  } catch (error) {
    console.error('Admin users fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Sanitize inputs
    const email = sanitizeInput(body.email)
    const name = sanitizeInput(body.name)
    const phone = sanitizeInput(body.phone)
    const role = sanitizeInput(body.role)
    const password = body.password

    // Validation
    if (!email || !name || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['USER', 'SARAF', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        role: role as any,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_CREATED',
        resource: 'USER',
        resourceId: user.id,
        details: JSON.stringify({
          email: user.email,
          name: user.name,
          role: user.role
        })
      }
    })

    return NextResponse.json({
      success: true,
      user
    })

  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}