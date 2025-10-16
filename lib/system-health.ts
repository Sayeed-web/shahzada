import { checkDatabaseHealth } from './database-health'

export interface SystemHealth {
  database: {
    connected: boolean
    error?: string
    latency?: number
  }
  apis: {
    crypto: boolean
    rates: boolean
    commodities: boolean
  }
  services: {
    auth: boolean
    notifications: boolean
    charts: boolean
  }
  overall: 'healthy' | 'degraded' | 'unhealthy'
}

export async function checkSystemHealth(): Promise<SystemHealth> {
  const health: SystemHealth = {
    database: { connected: false },
    apis: {
      crypto: false,
      rates: false,
      commodities: false
    },
    services: {
      auth: false,
      notifications: false,
      charts: false
    },
    overall: 'unhealthy'
  }

  try {
    // Check database
    health.database = await checkDatabaseHealth()

    // Check APIs
    try {
      const cryptoResponse = await fetch('https://api.coingecko.com/api/v3/ping', { 
        signal: AbortSignal.timeout(5000) 
      })
      health.apis.crypto = cryptoResponse.ok
    } catch {
      health.apis.crypto = false
    }

    try {
      const ratesResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD', { 
        signal: AbortSignal.timeout(5000) 
      })
      health.apis.rates = ratesResponse.ok
    } catch {
      health.apis.rates = false
    }

    // Check commodities API (using a real endpoint)
    try {
      const commoditiesResponse = await fetch('https://api.metals.live/v1/spot/gold', { 
        signal: AbortSignal.timeout(5000) 
      })
      health.apis.commodities = commoditiesResponse.ok
    } catch {
      health.apis.commodities = false
    }

    // Check services (simplified checks)
    health.services.auth = true // NextAuth is always available
    health.services.notifications = health.database.connected
    health.services.charts = true // TradingView is external

    // Calculate overall health
    const dbHealthy = health.database.connected
    const apisHealthy = Object.values(health.apis).some(api => api)
    const servicesHealthy = Object.values(health.services).every(service => service)

    if (dbHealthy && apisHealthy && servicesHealthy) {
      health.overall = 'healthy'
    } else if (dbHealthy || apisHealthy) {
      health.overall = 'degraded'
    } else {
      health.overall = 'unhealthy'
    }

  } catch (error) {
    console.error('System health check failed:', error)
    health.overall = 'unhealthy'
  }

  return health
}

export function getHealthStatusColor(status: string): string {
  switch (status) {
    case 'healthy': return 'text-green-500'
    case 'degraded': return 'text-yellow-500'
    case 'unhealthy': return 'text-red-500'
    default: return 'text-gray-500'
  }
}

export function getHealthStatusIcon(status: string): string {
  switch (status) {
    case 'healthy': return '✅'
    case 'degraded': return '⚠️'
    case 'unhealthy': return '❌'
    default: return '❓'
  }
}