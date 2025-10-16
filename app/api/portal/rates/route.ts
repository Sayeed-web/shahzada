import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeInput, validateNumericInput } from '@/lib/security'

export async function GET(request: NextRequest) {
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

    const rates = await prisma.rate.findMany({
      where: { sarafId: saraf.id },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(rates)

  } catch (error) {
    console.error('Rates fetch error:', error)
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
    const fromCurrency = sanitizeInput(body.fromCurrency)
    const toCurrency = sanitizeInput(body.toCurrency)
    const buyRate = validateNumericInput(body.buyRate)
    const sellRate = validateNumericInput(body.sellRate)

    if (!fromCurrency || !toCurrency || !buyRate || !sellRate) {
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

    const rate = await prisma.rate.create({
      data: {
        sarafId: saraf.id,
        fromCurrency,
        toCurrency,
        buyRate,
        sellRate,
        isActive: true
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'RATE_CREATED',
        resource: 'RATE',
        resourceId: rate.id,
        details: JSON.stringify({ fromCurrency, toCurrency, buyRate, sellRate })
      }
    })

    return NextResponse.json(rate)

  } catch (error) {
    console.error('Rate creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'SARAF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const rateId = sanitizeInput(body.id)
    
    if (!rateId) {
      return NextResponse.json({ error: 'Rate ID required' }, { status: 400 })
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

    const updateData: any = {}
    
    if (body.buyRate !== undefined) updateData.buyRate = validateNumericInput(body.buyRate)
    if (body.sellRate !== undefined) updateData.sellRate = validateNumericInput(body.sellRate)
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive)
    if (body.fromCurrency) updateData.fromCurrency = sanitizeInput(body.fromCurrency)
    if (body.toCurrency) updateData.toCurrency = sanitizeInput(body.toCurrency)

    const rate = await prisma.rate.update({
      where: {
        id: rateId,
        sarafId: saraf.id
      },
      data: updateData
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'RATE_UPDATED',
        resource: 'RATE',
        resourceId: rate.id,
        details: JSON.stringify(updateData)
      }
    })

    return NextResponse.json(rate)

  } catch (error) {
    console.error('Rate update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}