import { NextResponse } from 'next/server'
import { checkDatabaseConnection } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()
  
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: 'down' },
      auth: { status: 'up' },
      api: { status: 'up', responseTime: 0 }
    },
    version: '1.0.0',
    uptime: process.uptime()
  }

  try {
    const dbStart = Date.now()
    const isDbHealthy = await checkDatabaseConnection()
    const dbResponseTime = Date.now() - dbStart
    
    if (isDbHealthy) {
      healthCheck.services.database = {
        status: 'up',
        responseTime: dbResponseTime
      }
    } else {
      healthCheck.services.database = {
        status: 'down',
        error: 'Connection failed'
      }
      healthCheck.status = 'degraded'
    }
  } catch (error) {
    healthCheck.services.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    healthCheck.status = 'unhealthy'
  }

  if (!process.env.NEXTAUTH_SECRET) {
    healthCheck.services.auth = {
      status: 'down',
      error: 'Missing NEXTAUTH_SECRET'
    }
    healthCheck.status = 'degraded'
  }

  healthCheck.services.api.responseTime = Date.now() - startTime

  const statusCode = healthCheck.status === 'healthy' ? 200 : 
                    healthCheck.status === 'degraded' ? 200 : 503

  return NextResponse.json(healthCheck, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
}