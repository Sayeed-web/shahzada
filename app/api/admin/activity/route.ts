import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activities = await prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' }
    })

    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      action: activity.action,
      resource: activity.resource,
      details: activity.details || `${activity.action} performed on ${activity.resource}`,
      createdAt: activity.createdAt.toISOString(),
      userId: activity.userId
    }))

    return NextResponse.json(formattedActivities)
  } catch (error) {
    console.error('Admin activity fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}