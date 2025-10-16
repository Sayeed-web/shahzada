import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get SARAF users
    const sarafUsers = await prisma.user.findMany({
      where: { role: 'SARAF' }
    })

    const sarafs = []
    
    for (const user of sarafUsers) {
      // Check if saraf record already exists
      const existingSaraf = await prisma.saraf.findUnique({
        where: { userId: user.id }
      })
      
      if (!existingSaraf) {
        const saraf = await prisma.saraf.create({
          data: {
            userId: user.id,
            businessName: user.name,
            businessAddress: getAddressForEmail(user.email),
            businessPhone: user.phone || '+93700000000',
            status: 'APPROVED',
            isActive: true,
            isPremium: isPremiumSaraf(user.email),
            rating: getRatingForEmail(user.email)
          }
        })
        sarafs.push(saraf)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Sarafs created successfully!',
      sarafs: sarafs
    })
  } catch (error) {
    console.error('Saraf creation error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create sarafs',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

function getAddressForEmail(email: string): string {
  if (email.includes('kabul')) return 'کابل، شهر نو'
  if (email.includes('herat')) return 'هرات، شهر کهنه'
  if (email.includes('mazar')) return 'مزار شریف، بالاحصار'
  if (email.includes('kandahar')) return 'قندهار، چهارراهی حیدری'
  return 'کابل، مرکز شهر'
}

function isPremiumSaraf(email: string): boolean {
  return email.includes('ahmad') || email.includes('omar')
}

function getRatingForEmail(email: string): number {
  if (email.includes('ahmad')) return 4.8
  if (email.includes('hassan')) return 4.5
  if (email.includes('omar')) return 4.6
  if (email.includes('ali')) return 4.4
  return 4.3
}