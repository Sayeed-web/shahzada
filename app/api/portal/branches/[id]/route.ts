import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'SARAF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const branchId = params.id
    const body = await request.json()

    const saraf = await prisma.saraf.findFirst({
      where: { 
        userId: session.user.id,
        status: 'APPROVED'
      }
    })

    if (!saraf) {
      return NextResponse.json({ error: 'Saraf not approved or not found' }, { status: 403 })
    }

    const updateData: any = {}
    
    if (body.name) updateData.name = sanitizeInput(body.name)
    if (body.address) updateData.address = sanitizeInput(body.address)
    if (body.phone) updateData.phone = sanitizeInput(body.phone)
    if (body.city) updateData.city = sanitizeInput(body.city)
    if (body.country) updateData.country = sanitizeInput(body.country)
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive)

    const branch = await prisma.sarafBranch.update({
      where: {
        id: branchId,
        sarafId: saraf.id
      },
      data: updateData
    })

    return NextResponse.json({ success: true, branch })

  } catch (error) {
    console.error('Branch update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'SARAF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const branchId = params.id

    const saraf = await prisma.saraf.findFirst({
      where: { 
        userId: session.user.id,
        status: 'APPROVED'
      }
    })

    if (!saraf) {
      return NextResponse.json({ error: 'Saraf not approved or not found' }, { status: 403 })
    }

    const transactionCount = await prisma.transaction.count({
      where: { branchId }
    })

    if (transactionCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete branch with existing transactions' 
      }, { status: 400 })
    }

    await prisma.sarafBranch.delete({
      where: {
        id: branchId,
        sarafId: saraf.id
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Branch deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}