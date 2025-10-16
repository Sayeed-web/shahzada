import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id: sarafId } = await params
    const { rating, comment } = await request.json()

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Check if saraf exists and is approved
    const saraf = await prisma.saraf.findFirst({
      where: {
        id: sarafId,
        status: 'APPROVED',
        isActive: true
      }
    })

    if (!saraf) {
      return NextResponse.json({ error: 'Saraf not found' }, { status: 404 })
    }

    // Check if user already rated this saraf
    const existingRating = await prisma.sarafRating.findUnique({
      where: {
        userId_sarafId: {
          userId: session.user.id,
          sarafId: sarafId
        }
      }
    })

    let sarafRating
    if (existingRating) {
      // Update existing rating
      sarafRating = await prisma.sarafRating.update({
        where: { id: existingRating.id },
        data: {
          rating,
          comment: comment || null,
          updatedAt: new Date()
        }
      })
    } else {
      // Create new rating
      sarafRating = await prisma.sarafRating.create({
        data: {
          userId: session.user.id,
          sarafId: sarafId,
          rating,
          comment: comment || null
        }
      })
    }

    // Recalculate saraf's average rating
    const ratings = await prisma.sarafRating.findMany({
      where: { sarafId: sarafId }
    })

    const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length

    // Update saraf's rating
    await prisma.saraf.update({
      where: { id: sarafId },
      data: { rating: averageRating }
    })

    // Create notification for saraf
    await prisma.notification.create({
      data: {
        userId: saraf.userId,
        title: 'امتیاز جدید',
        message: `${session.user.name} به شما امتیاز ${rating} ستاره داد`,
        type: 'info',
        action: 'NEW_RATING',
        resource: 'SARAF',
        resourceId: sarafId,
        data: JSON.stringify({
          rating,
          comment,
          raterName: session.user.name
        })
      }
    })

    return NextResponse.json({
      success: true,
      rating: sarafRating,
      newAverageRating: averageRating
    })

  } catch (error) {
    console.error('Saraf voting error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: sarafId } = await params

    // Get all ratings for this saraf
    const ratings = await prisma.sarafRating.findMany({
      where: { sarafId },
      include: {
        user: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get user's rating if authenticated
    let userRating = null
    if (session?.user?.id) {
      userRating = await prisma.sarafRating.findUnique({
        where: {
          userId_sarafId: {
            userId: session.user.id,
            sarafId: sarafId
          }
        }
      })
    }

    return NextResponse.json({
      ratings: ratings.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        userName: r.user.name,
        createdAt: r.createdAt,
        isVerified: r.isVerified
      })),
      userRating,
      totalRatings: ratings.length,
      averageRating: ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0
    })

  } catch (error) {
    console.error('Get saraf ratings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}