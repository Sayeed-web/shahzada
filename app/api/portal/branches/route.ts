import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'SARAF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const saraf = await prisma.saraf.findFirst({
      where: { 
        userId: session.user.id,
        status: 'APPROVED'
      }
    })

    if (!saraf) {
      return NextResponse.json({ error: 'Saraf not approved or not found' }, { status: 403 })
    }

    try {
      const branches = await prisma.sarafBranch.findMany({
        where: { sarafId: saraf.id },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({ branches })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ branches: [] })
    }

  } catch (error) {
    console.error('Branches fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'SARAF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const name = sanitizeInput(body.name)
    const address = sanitizeInput(body.address)
    const phone = sanitizeInput(body.phone)
    const city = sanitizeInput(body.city)
    const country = sanitizeInput(body.country) || 'Afghanistan'

    if (!name || !address || !phone || !city) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const saraf = await prisma.saraf.findFirst({
      where: { 
        userId: session.user.id,
        status: 'APPROVED'
      }
    })

    if (!saraf) {
      return NextResponse.json({ error: 'Saraf not approved or not found' }, { status: 403 })
    }

    try {
      const branch = await prisma.sarafBranch.create({
        data: {
          sarafId: saraf.id,
          name,
          address,
          phone,
          city,
          country,
          isActive: true
        }
      })

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'BRANCH_CREATED',
          resource: 'SARAF_BRANCH',
          resourceId: branch.id,
          details: JSON.stringify({ name, city, address })
        }
      })

      return NextResponse.json({ success: true, branch })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Database operation failed' }, { status: 503 })
    }

  } catch (error) {
    console.error('Branch creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}