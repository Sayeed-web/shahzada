'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, Video, Facebook, MessageSquare, RefreshCw } from 'lucide-react'
import { FacebookContent } from '@/components/social/FacebookContent'

interface ContentItem {
  id: string
  title: string
  type: 'IFRAME' | 'VIDEO' | 'FACEBOOK' | 'ANNOUNCEMENT'
  content: string
  url?: string
  isActive: boolean
  position: string
  createdAt: string
  updatedAt: string
}

export function ContentDisplay() {
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchContent()
    
    // Refresh content every 30 seconds to avoid rate limits
    const interval = setInterval(() => fetchContent(), 30000)
    
    // Refresh when window gains focus (user returns to tab)
    const handleFocus = () => {
      const timeSinceLastFetch = Date.now() - lastFetch
      if (timeSinceLastFetch > 10000) { // Only if more than 10 seconds since last fetch
        fetchContent(true)
      }
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [lastFetch])

  const fetchContent = async (force = false) => {
    if (refreshing && !force) return
    
    try {
      setRefreshing(true)
      setError(null)
      const now = Date.now()
      
      const response = await fetch(`/api/content?_t=${now}&_force=${force ? '1' : '0'}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'If-None-Match': '*'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched content items:', data.length)
        setContentItems(data)
        setLastFetch(now)
      } else {
        console.error('Content fetch failed:', response.status)
        setError(`خطا در بارگذاری: ${response.status}`)
      }
    } catch (error) {
      console.error('Content fetch error:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const renderContent = (item: ContentItem) => {
    switch (item.type) {
      case 'IFRAME':
        // Block TradingView URLs and example.com
        if (item.url && (item.url.toLowerCase().includes('tradingview') || item.url.toLowerCase().includes('example.com'))) {
          return (
            <div className="w-full h-48 sm:h-64 border rounded overflow-hidden bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">
                  {item.url.toLowerCase().includes('example.com') ? 'URL نمونه قابل نمایش نیست' : 'نمودار معاملاتی در حال حاضر غیرفعال است'}
                </p>
                {!item.url.toLowerCase().includes('example.com') && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                    مشاهده در صفحه اصلی
                  </a>
                )}
              </div>
            </div>
          )
        }
        return (
          <div className="w-full h-64 border rounded overflow-hidden bg-gray-50">
            <iframe
              src={item.url}
              className="w-full h-full rounded"
              title={item.title}
              frameBorder="0"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLIFrameElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  parent.innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-sm text-gray-500">این محتوا قابل نمایش نیست. <a href="' + item.url + '" target="_blank" class="text-blue-600 underline">مشاهده در صفحه اصلی</a></p></div>'
                }
              }}
            />
          </div>
        )
      
      case 'VIDEO':
        if (item.url?.includes('youtube.com') || item.url?.includes('youtu.be')) {
          const videoId = item.url.includes('youtu.be') 
            ? item.url.split('/').pop()?.split('?')[0]
            : item.url.split('v=')[1]?.split('&')[0]
          
          return (
            <div className="space-y-3">
              <div className="relative w-full h-48 sm:h-64 border rounded bg-black overflow-hidden">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&controls=1`}
                  className="w-full h-full rounded"
                  title={item.title}
                  frameBorder="0"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <a
                href={`https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Video className="h-4 w-4" />
                مشاهده در یوتیوب
              </a>
            </div>
          )
        }
        return (
          <div className="w-full h-48 sm:h-64 border rounded flex items-center justify-center">
            <p className="text-muted-foreground">ویدیو قابل نمایش نیست</p>
          </div>
        )
      
      case 'FACEBOOK':
        if (item.url) {
          return (
            <div className="space-y-4">
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <Facebook className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                {item.content && (
                  <p className="text-sm text-gray-600 mb-4">{item.content}</p>
                )}
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Facebook className="h-4 w-4" />
                  مشاهده در فیسبوک
                </a>
              </div>
            </div>
          )
        }
        return (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800">{item.content || 'محتوای فیسبوک'}</p>
          </div>
        )
      
      case 'ANNOUNCEMENT':
        return (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800">{item.content}</p>
          </div>
        )
      
      default:
        return null
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IFRAME': return <Globe className="h-4 w-4" />
      case 'VIDEO': return <Video className="h-4 w-4" />
      case 'FACEBOOK': return <Facebook className="h-4 w-4" />
      case 'ANNOUNCEMENT': return <MessageSquare className="h-4 w-4" />
      default: return <Globe className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchContent}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          تلاش مجدد
        </button>
      </div>
    )
  }

  if (contentItems.length === 0 && !loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">هیچ محتوایی برای نمایش وجود ندارد</p>
        <p className="text-sm text-muted-foreground mt-2">محتوا را از پنل مدیریت اضافه کنید</p>
        <button 
          onClick={fetchContent}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          بارگذاری مجدد
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">محتوای ویژه</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{contentItems.length} مورد</span>
          <span>| آخرین بروزرسانی: {new Date(lastFetch).toLocaleTimeString('fa-IR')}</span>
          <button 
            onClick={() => fetchContent(true)}
            disabled={refreshing}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'در حال بروزرسانی...' : 'بروزرسانی'}
          </button>
        </div>
      </div>
      
      {/* Facebook Content Section */}
      <div className="mb-8">
        <FacebookContent limit={3} showHeader={true} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {contentItems.map((item) => (
          item.type === 'FACEBOOK' ? (
            <div key={item.id}>
              {renderContent(item)}
            </div>
          ) : (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getTypeIcon(item.type)}
                    {item.title}
                  </CardTitle>
                  <Badge variant="outline">
                    {item.type === 'IFRAME' ? 'صفحه وب' :
                     item.type === 'VIDEO' ? 'ویدیو' :
                     item.type === 'FACEBOOK' ? 'فیسبوک' : 'اعلان'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {renderContent(item)}
                {item.content && item.type !== 'ANNOUNCEMENT' && (
                  <p className="text-sm text-muted-foreground mt-3">{item.content}</p>
                )}
              </CardContent>
            </Card>
          )
        ))}
      </div>
    </div>
  )
}