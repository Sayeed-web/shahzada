'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building, Star, Phone, MapPin, MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { WorkingSarafChat } from '@/components/chat/WorkingSarafChat'

interface Saraf {
  id: string
  businessName: string
  businessAddress: string
  businessPhone: string
  rating: number
  isActive: boolean
  isPremium: boolean
}

export default function WorkingSarafsPage() {
  const [sarafs, setSarafs] = useState<Saraf[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSaraf, setSelectedSaraf] = useState<Saraf | null>(null)

  useEffect(() => {
    loadSarafs()
  }, [])

  const loadSarafs = async () => {
    try {
      const res = await fetch('/api/sarafs')
      if (res.ok) {
        const data = await res.json()
        setSarafs(data)
      }
    } catch (error) {
      console.error('Failed to load sarafs:', error)
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">صرافان معتبر</h1>
          <p className="text-lg text-muted-foreground">
            انتخاب کنید و گفتگو را شروع کنید
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }, (_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            sarafs.map((saraf) => (
              <Card key={saraf.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{saraf.businessName}</CardTitle>
                    </div>
                    {saraf.isPremium && (
                      <Badge className="bg-yellow-500 text-yellow-900">ممتاز</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {renderStars(saraf.rating)}
                    </div>
                    <span className="text-sm font-medium">{saraf.rating.toFixed(1)}</span>
                    <Badge variant={saraf.isActive ? 'default' : 'secondary'}>
                      {saraf.isActive ? 'فعال' : 'غیرفعال'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{saraf.businessAddress}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span>{saraf.businessPhone}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => setSelectedSaraf(saraf)}
                    disabled={!saraf.isActive}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    شروع گفتگو
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {sarafs.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">صرافی یافت نشد</h3>
              <p className="text-muted-foreground">در حال حاضر صرافی فعال موجود نیست.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedSaraf && (
        <WorkingSarafChat
          sarafId={selectedSaraf.id}
          sarafName={selectedSaraf.businessName}
          sarafPhone={selectedSaraf.businessPhone}
          onClose={() => setSelectedSaraf(null)}
        />
      )}
    </DashboardLayout>
  )
}