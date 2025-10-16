'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Server,
  Database,
  Wifi,
  HardDrive
} from 'lucide-react'
import { monitoring } from '@/lib/monitoring'
import { i18n } from '@/lib/i18n-enhanced'

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  metrics: {
    totalRequests: number
    totalErrors: number
    criticalErrors: number
    highErrors: number
    avgResponseTime: number
    errorRate: number
  }
  timestamp: Date
}

interface SystemMetric {
  name: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'critical'
  threshold: number
}

export function SystemHealthMonitor() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [metrics, setMetrics] = useState<SystemMetric[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    loadSystemHealth()
    const interval = setInterval(loadSystemHealth, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadSystemHealth = async () => {
    try {
      setIsLoading(true)
      
      // Get system health from monitoring
      const systemHealth = monitoring.getSystemHealth()
      setHealth(systemHealth)

      // Load additional metrics
      const metricsResponse = await fetch('/api/admin/system/metrics')
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setMetrics(metricsData.metrics || [])
      }

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to load system health:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'good':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'critical':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatMetricValue = (value: number, unit: string) => {
    if (unit === 'ms') {
      return `${Math.round(value)}ms`
    }
    if (unit === '%') {
      return `${Math.round(value * 100)}%`
    }
    if (unit === 'MB') {
      return `${Math.round(value)}MB`
    }
    return `${value}${unit}`
  }

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>{i18n.t('admin.systemHealth')}</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={health?.status === 'healthy' ? 'default' : 'destructive'}>
              {health?.status || 'unknown'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSystemHealth}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {health && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(health.status)}
                <div>
                  <p className="font-medium">
                    {i18n.t('admin.overallStatus')}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {health.status}
                  </p>
                </div>
              </div>
              <div>
                <p className="font-medium">
                  {i18n.t('admin.totalRequests')}
                </p>
                <p className="text-2xl font-bold">
                  {i18n.formatNumber(health.metrics.totalRequests)}
                </p>
              </div>
              <div>
                <p className="font-medium">
                  {i18n.t('admin.errorRate')}
                </p>
                <p className="text-2xl font-bold">
                  {Math.round(health.metrics.errorRate * 100)}%
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{metric.name}</p>
                <Badge 
                  variant={metric.status === 'good' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {metric.status}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold">
                  {formatMetricValue(metric.value, metric.unit)}
                </p>
                <Progress 
                  value={(metric.value / metric.threshold) * 100}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Threshold: {formatMetricValue(metric.threshold, metric.unit)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Error Summary */}
      {health && health.metrics.totalErrors > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span>{i18n.t('admin.errorSummary')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">
                  {health.metrics.criticalErrors}
                </p>
                <p className="text-sm text-muted-foreground">
                  {i18n.t('admin.criticalErrors')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-500">
                  {health.metrics.highErrors}
                </p>
                <p className="text-sm text-muted-foreground">
                  {i18n.t('admin.highErrors')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {health.metrics.totalErrors}
                </p>
                <p className="text-sm text-muted-foreground">
                  {i18n.t('admin.totalErrors')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Alerts */}
      {health?.status === 'critical' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {i18n.t('admin.criticalSystemAlert')}
          </AlertDescription>
        </Alert>
      )}

      {health?.status === 'warning' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {i18n.t('admin.warningSystemAlert')}
          </AlertDescription>
        </Alert>
      )}

      {/* Last Update */}
      <div className="text-center text-sm text-muted-foreground">
        {i18n.t('admin.lastUpdate')}: {i18n.formatDate(lastUpdate)}
      </div>
    </div>
  )
}