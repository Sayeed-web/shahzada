'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, ExternalLink, Maximize2 } from 'lucide-react'

interface LiveWebsitePreviewProps {
  url: string
  title: string
  height?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export function LiveWebsitePreview({ 
  url, 
  title, 
  height = 600, 
  autoRefresh = true, 
  refreshInterval = 30000 
}: LiveWebsitePreviewProps) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      handleRefresh()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  const handleRefresh = () => {
    setIsLoading(true)
    setRefreshKey(prev => prev + 1)
    setLastRefresh(Date.now())
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  const getProxyUrl = (originalUrl: string) => {
    // For Facebook pages, use Facebook Page Plugin
    if (originalUrl.includes('facebook.com')) {
      return `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(originalUrl)}&tabs=timeline&width=500&height=${height}&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId`
    }
    
    // For other sites, use direct URL with cache busting
    return `${originalUrl}${originalUrl.includes('?') ? '&' : '?'}_t=${refreshKey}`
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg truncate">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(url, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          آخرین بروزرسانی: {new Date(lastRefresh).toLocaleTimeString('fa-IR')}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative" style={{ height: `${height}px` }}>
          {isLoading && (
            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center z-10">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
              </div>
            </div>
          )}
          <iframe
            key={refreshKey}
            src={getProxyUrl(url)}
            className="w-full h-full border-0"
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation allow-top-navigation"
            onLoad={handleLoad}
          />
        </div>
      </CardContent>
    </Card>
  )
}