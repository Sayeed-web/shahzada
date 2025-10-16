'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building, Star, Phone, MapPin, Search, Filter, ArrowRight, MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { RealSarafChat } from '@/components/chat/RealSarafChat'

interface Saraf {
  id: string
  businessName: string
  businessAddress: string
  businessPhone: string
  rating: number
  totalTransactions: number
  isActive: boolean
  isPremium: boolean
  rates: {
    fromCurrency: string
    toCurrency: string
    buyRate: number
    sellRate: number
  }[]
}

export default function SarafsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [sortBy, setSortBy] = useState('rating')
  const [selectedSarafId, setSelectedSarafId] = useState<string | null>(null)
  const [showChat, setShowChat] = useState(false)

  const [sarafs, setSarafs] = useState<Saraf[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSarafs = async () => {
      try {
        const params = new URLSearchParams({
          search: searchTerm,
          city: cityFilter,
          sort: sortBy
        })
        const response = await fetch(`/api/sarafs/directory?${params}`)
        if (response.ok) {
          const data = await response.json()
          setSarafs(data.sarafs || data)
        }
      } catch (error) {
        console.error('Failed to fetch sarafs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSarafs()
  }, [searchTerm, cityFilter, sortBy])

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

  const cities = ['کابل', 'هرات', 'مزار شریف', 'قندهار', 'جلال آباد']

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            صرافان معتبر
          </h1>
          <p className="text-lg text-muted-foreground">
            فهرست کامل صرافان تایید شده و نرخ‌های آن‌ها
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              فیلتر و جستجو
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="جستجو در نام صرافی..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>

              <Select value={cityFilter || 'all'} onValueChange={(v) => setCityFilter(v === 'all' ? 'all' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب شهر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه شهرها</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy || 'rating'} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="مرتب‌سازی" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">بالاترین امتیاز</SelectItem>
                  <SelectItem value="transactions">بیشترین تراکنش</SelectItem>
                  <SelectItem value="name">نام صرافی</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => {
                setSearchTerm('')
                setCityFilter('all')
                setSortBy('rating')
              }}>
                پاک کردن فیلترها
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sarafs List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }, (_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            sarafs?.map((saraf) => (
              <Card key={saraf.id} className="hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{saraf.businessName}</CardTitle>
                    </div>
                    {saraf.isPremium && (
                      <Badge variant="default" className="text-xs">
                        ممتاز
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {renderStars(saraf.rating)}
                    </div>
                    <span className="text-sm font-medium persian-numbers">
                      {saraf.rating.toFixed(1)}
                    </span>
                    <Badge variant="outline" className="text-xs">
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
                      <span className="persian-numbers">{saraf.businessPhone}</span>
                    </div>
                    
                    <div className="text-xs">
                      تراکنش‌های انجام شده: <span className="persian-numbers">{saraf.totalTransactions}</span>
                    </div>
                  </div>

                  {saraf.rates.length > 0 && (
                    <div className="pt-3 border-t">
                      <div className="text-xs text-muted-foreground mb-2">نرخ‌های فعلی:</div>
                      <div className="space-y-1">
                        {saraf.rates.slice(0, 3).map((rate) => (
                          <div key={`${rate.fromCurrency}-${rate.toCurrency}`} className="flex justify-between text-xs">
                            <span className="font-medium">{rate.fromCurrency}/{rate.toCurrency}</span>
                            <div className="persian-numbers">
                              خرید: {rate.buyRate} - فروش: {rate.sellRate}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700" 
                      onClick={() => {
                        setSelectedSarafId(saraf.id)
                        setShowChat(true)
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      شروع گفتگو
                    </Button>
                    <Button className="w-full" variant="outline" asChild>
                      <Link href={`/sarafs/${saraf.id}`}>
                        مشاهده جزئیات
                        <ArrowRight className="h-4 w-4 mr-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {sarafs && sarafs.length === 0 && !isLoading && (
          <Card>
            <CardContent className="text-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">صرافی یافت نشد</h3>
              <p className="text-muted-foreground">
                با فیلترهای انتخاب شده، صرافی یافت نشد. لطفاً فیلترها را تغییر دهید.
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Chat Component */}
        {showChat && selectedSarafId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <RealSarafChat 
              sarafId={selectedSarafId}
              onClose={() => {
                setShowChat(false)
                setSelectedSarafId(null)
              }}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}