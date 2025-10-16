import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const sarafId = params.id

    try {
      const updateData: any = {}
      
      if (body.status !== undefined) {
        updateData.status = body.status
      }
      
      if (body.isPremium !== undefined) {
        updateData.isPremium = body.isPremium
      }

      if (body.isFeatured !== undefined) {
        updateData.isFeatured = body.isFeatured
      }

      const saraf = await prisma.saraf.update({
        where: { id: sarafId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
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
        }
      })

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'SARAF_UPDATED',
          resource: 'SARAF',
          resourceId: saraf.id,
          details: JSON.stringify(updateData)
        }
      })

      return NextResponse.json(saraf)
    } catch (dbError) {
      console.error('Database error updating saraf:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 503 })
    }

  } catch (error) {
    console.error('Saraf update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const sarafId = params.id

    try {
      const saraf = await prisma.saraf.update({
        where: { id: sarafId },
        data: {
          isFeatured: body.isFeatured
        }
      })

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'SARAF_FEATURED_UPDATED',
          resource: 'SARAF',
          resourceId: saraf.id,
          details: JSON.stringify({ isFeatured: body.isFeatured })
        }
      })

      return NextResponse.json(saraf)
    } catch (dbError) {
      console.error('Database error updating saraf featured status:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 503 })
    }

  } catch (error) {
    console.error('Saraf featured update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}