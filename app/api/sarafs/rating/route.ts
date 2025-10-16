import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sarafId, rating, comment } = await request.json()
    
    if (!sarafId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating data' }, { status: 400 })
    }

    const sanitizedSarafId = sanitizeInput(sarafId)
    const sanitizedComment = sanitizeInput(comment || '')

    // Create rating record
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'SARAF_RATING',
        resource: 'saraf',
        resourceId: sanitizedSarafId,
        details: JSON.stringify({
          rating: Number(rating),
          comment: sanitizedComment
        })
      }
    })

    // Calculate new average rating
    const ratings = await prisma.auditLog.findMany({
      where: {
        action: 'SARAF_RATING',
        resourceId: sanitizedSarafId
      }
    })

    const totalRating = ratings.reduce((sum, r) => {
      const details = JSON.parse(r.details || '{}')
      return sum + (details.rating || 0)
    }, 0)

    const averageRating = totalRating / ratings.length

    // Update saraf rating
    await prisma.saraf.update({
      where: { id: sanitizedSarafId },
      data: { rating: averageRating }
    })

    return NextResponse.json({
      success: true,
      averageRating,
      totalRatings: ratings.length
    })

  } catch (error) {
    console.error('Saraf rating error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}