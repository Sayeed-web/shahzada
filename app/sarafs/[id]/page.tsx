'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building, Star, Phone, MapPin, ArrowLeft, Clock, TrendingUp, TrendingDown, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { EnhancedSarafChatWidget } from '@/components/chat/EnhancedSarafChatWidget'
import { SarafVoting } from '@/components/saraf/SarafVoting'

interface SarafDetail {
  id: string
  businessName: string
  businessAddress: string
  businessPhone: string
  rating: number
  totalTransactions: number
  isActive: boolean
  isPremium: boolean
  description: string
  workingHours: string
  services: string[]
  rates: {
    fromCurrency: string
    toCurrency: string
    buyRate: number
    sellRate: number
    lastUpdate: string
  }[]
  reviews: {
    id: string
    userName: string
    rating: number
    comment: string
    date: string
  }[]
  stats: {
    completedTransactions: number
    averageResponseTime: string
    customerSatisfaction: number
  }
}

export default function SarafDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [saraf, setSaraf] = useState<SarafDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    const fetchSarafDetail = async () => {
      try {
        const response = await fetch(`/api/sarafs/${id}`)
        if (response.ok) {
          const data = await response.json()
          setSaraf(data)
        } else {
          console.error('Failed to fetch saraf details')
        }
      } catch (error) {
        console.error('Failed to fetch saraf details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSarafDetail()
  }, [id])

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ))
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!saraf) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">صرافی یافت نشد</h2>
          <Button asChild>
            <Link href="/sarafs">بازگشت به فهرست صرافان</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm">
            <Link href="/sarafs">
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              بازگشت
            </Link>
          </Button>
        </div>

        {/* Main Info */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-2 sm:gap-3 flex-1">
                <Building className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0 mt-1" />
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl break-words">{saraf.businessName}</CardTitle>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      {renderStars(saraf.rating)}
                    </div>
                    <span className="font-medium persian-numbers text-sm">{saraf.rating}</span>
                    <Badge variant={saraf.isActive ? 'default' : 'secondary'} className="text-xs">
                      {saraf.isActive ? 'فعال' : 'غیرفعال'}
                    </Badge>
                    {saraf.isPremium && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-xs">
                        ممتاز
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button 
                  size="sm"
                  onClick={() => setShowChat(true)}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto text-xs sm:text-sm"
                >
                  <MessageCircle className="h-4 w-4 mr-1 sm:mr-2" />
                  شروع گفتگو
                </Button>
                {saraf.businessPhone && (
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`tel:${saraf.businessPhone}`)}
                    className="border-2 hover:bg-blue-50 w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    تماس تلفنی
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-start gap-2 text-muted-foreground text-sm">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="break-words">{saraf.businessAddress}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span className="persian-numbers">{saraf.businessPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>{saraf.workingHours}</span>
                </div>
              </div>
              
              <div className="text-center p-3 sm:p-0">
                <div className="text-xl sm:text-2xl font-bold persian-numbers">{saraf.stats.completedTransactions}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">تراکنش تکمیل شده</div>
              </div>
              
              <div className="text-center p-3 sm:p-0">
                <div className="text-xl sm:text-2xl font-bold persian-numbers">{saraf.stats.customerSatisfaction}%</div>
                <div className="text-xs sm:text-sm text-muted-foreground">رضایت مشتریان</div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <p className="text-muted-foreground">{saraf.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="rates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="rates" className="text-xs sm:text-sm p-2 sm:p-3">نرخهای ارز</TabsTrigger>
            <TabsTrigger value="services" className="text-xs sm:text-sm p-2 sm:p-3">خدمات</TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs sm:text-sm p-2 sm:p-3">نظرات</TabsTrigger>
            <TabsTrigger value="stats" className="text-xs sm:text-sm p-2 sm:p-3">آمار</TabsTrigger>
          </TabsList>

          <TabsContent value="rates">
            <Card>
              <CardHeader>
                <CardTitle>نرخهای فعلی ارز</CardTitle>
                <CardDescription>آخرین نرخهای خرید و فروش</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {saraf.rates.map((rate) => (
                    <Card key={`${rate.fromCurrency}-${rate.toCurrency}`}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="text-center">
                          <div className="font-semibold text-base sm:text-lg mb-2">
                            {rate.fromCurrency}/{rate.toCurrency}
                          </div>
                          <div className="space-y-1 sm:space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-green-600">خرید:</span>
                              <span className="font-mono persian-numbers">{rate.buyRate}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-red-600">فروش:</span>
                              <span className="font-mono persian-numbers">{rate.sellRate}</span>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            آخرین بروزرسانی: {new Date(rate.lastUpdate).toLocaleTimeString('fa-IR')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>خدمات ارائه شده</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {saraf.services.map((service) => (
                    <div key={service} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      <span className="break-words">{service}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <SarafVoting sarafId={saraf.id} />
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card>
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="text-2xl sm:text-3xl font-bold persian-numbers mb-2">
                    {saraf.stats.completedTransactions}
                  </div>
                  <div className="text-sm sm:text-base text-muted-foreground">تراکنش تکمیل شده</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="text-2xl sm:text-3xl font-bold persian-numbers mb-2">
                    {saraf.stats.averageResponseTime}
                  </div>
                  <div className="text-sm sm:text-base text-muted-foreground">متوسط زمان پاسخ</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="text-2xl sm:text-3xl font-bold persian-numbers mb-2">
                    {saraf.stats.customerSatisfaction}%
                  </div>
                  <div className="text-sm sm:text-base text-muted-foreground">رضایت مشتریان</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Enhanced Chat Widget */}
      {showChat && saraf && (
        <EnhancedSarafChatWidget
          sarafId={saraf.id}
          sarafInfo={{
            id: saraf.id,
            businessName: saraf.businessName,
            businessPhone: saraf.businessPhone,
            businessAddress: saraf.businessAddress,
            rating: saraf.rating,
            isActive: saraf.isActive,
            isPremium: saraf.isPremium
          }}
          onClose={() => setShowChat(false)}
        />
      )}
    </DashboardLayout>
  )
}