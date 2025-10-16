import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (authResult.status !== 200) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get security metrics
    const [
      failedLogins,
      suspiciousActivity,
      recentUploads,
      adminActions
    ] = await Promise.all([
      // Failed login attempts (from audit logs)
      prisma.auditLog.count({
        where: {
          action: 'LOGIN_FAILED',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      
      // Suspicious activity patterns
      prisma.auditLog.findMany({
        where: {
          OR: [
            { action: { contains: 'FAILED' } },
            { action: { contains: 'BLOCKED' } },
            { action: { contains: 'SUSPICIOUS' } }
          ],
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      
      // Recent file uploads
      prisma.document.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Admin actions
      prisma.auditLog.count({
        where: {
          action: { in: ['USER_CREATED', 'USER_DELETED', 'CONTENT_CREATED'] },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    return NextResponse.json({
      metrics: {
        failedLogins,
        suspiciousActivity: suspiciousActivity.length,
        recentUploads,
        adminActions
      },
      alerts: suspiciousActivity.map(log => ({
        timestamp: log.createdAt,
        action: log.action,
        details: log.details,
        userId: log.userId
      })),
      recommendations: [
        failedLogins > 10 ? 'High number of failed logins detected' : null,
        recentUploads > 50 ? 'Unusual upload activity detected' : null,
        'Regularly review audit logs',
        'Monitor for suspicious patterns'
      ].filter(Boolean)
    })

  } catch (error) {
    console.error('Security monitoring error:', error)
    return NextResponse.json({ error: 'Failed to fetch security data' }, { status: 500 })
  }
}