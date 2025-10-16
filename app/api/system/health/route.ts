import { NextResponse } from 'next/server'
import { checkSystemHealth } from '@/lib/system-health'

export async function GET() {
  try {
    const health = await checkSystemHealth()
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      health
    })
  } catch (error) {
    console.error('System health check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Failed to check system health',
      health: {
        database: { connected: false, error: 'Health check failed' },
        apis: { crypto: false, rates: false, commodities: false },
        services: { auth: false, notifications: false, charts: false },
        overall: 'unhealthy'
      }
    }, { status: 500 })
  }
}