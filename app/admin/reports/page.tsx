'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, Users, DollarSign, Building, Calendar, Download, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

interface ReportData {
  users?: {
    totalUsers: number
    newUsers: number
    activeUsers: number
    usersByRole: Array<{ role: string; _count: number }>
  }
  sarafs?: {
    totalSarafs: number
    approvedSarafs: number
    pendingSarafs: number
    premiumSarafs: number
  }
  transactions?: {
    totalTransactions: number
    completedTransactions: number
    pendingTransactions: number
    totalVolume: number
  }
  financial?: {
    totalVolume: number
    totalFees: number
    transactionsByType: Array<{ type: string; _sum: { toAmount: number }; _count: number }>
  }
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: currency === 'AFN' ? 'IRR' : currency,
    minimumFractionDigits: 0
  }).format(amount).replace('ریال', 'افغانی')
}

const getTransactionTypeLabel = (type: string) => {
  const labels = {
    'HAWALA': 'حواله',
    'EXCHANGE': 'تبدیل ارز',
    'CRYPTO': 'رمزارز'
  }
  return labels[type as keyof typeof labels] || type
}

export default function AdminReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reportData, setReportData] = useState<ReportData>({})
  const [reportType, setReportType] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }
    fetchReportData()
  }, [session, status, router, reportType])

  const fetchReportData = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/reports?type=${reportType}`)
      if (!response.ok) throw new Error('Failed to fetch report data')
      const data = await response.json()
      setReportData(data)
    } catch (error) {
      setError('خطا در بارگذاری گزارش')
    } finally {
      setIsLoading(false)
    }
  }

  const exportReport = async (format: string) => {
    try {
      const response = await fetch(`/api/admin/reports/export?type=${reportType}&format=${format}`)
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${reportType}-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      setError('خطا در خروجی گزارش')
    }
  }

  if (status === 'loading' || !session) {
    return <div>در حال بارگذاری...</div>
  }

  if (session.user.role !== 'ADMIN') {
    return <div>دسترسی غیرمجاز</div>
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">گزارشات سیستم</h1>
              <p className="text-muted-foreground">گزارشات جامع از عملکرد سیستم</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">کلی</SelectItem>
                <SelectItem value="financial">مالی</SelectItem>
                <SelectItem value="users">کاربران</SelectItem>
                <SelectItem value="sarafs">صرافان</SelectItem>
                <SelectItem value="transactions">تراکنشها</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={fetchReportData} disabled={isLoading} className="w-full sm:w-auto">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button onClick={() => exportReport('pdf')} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              خروجی PDF
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="loading-spinner mx-auto" />
            <p className="text-muted-foreground mt-2">در حال تولید گزارش...</p>
          </div>
        ) : reportData ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">کل کاربران</p>
                      <p className="text-2xl font-bold">{reportData.users?.totalUsers || 0}</p>
                      <p className="text-xs text-green-600">+12% این ماه</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">صرافان فعال</p>
                      <p className="text-2xl font-bold">{reportData.sarafs?.totalSarafs || 0}</p>
                    </div>
                    <Building className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">کل تراکنشها</p>
                      <p className="text-2xl font-bold">{reportData.transactions?.totalTransactions || 0}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">حجم کل</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(reportData.financial?.totalVolume || 0, 'AFN')}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Sarafs */}
            <Card>
              <CardHeader>
                <CardTitle>برترین صرافان</CardTitle>
                <CardDescription>صرافان با بیشترین حجم تراکنش</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(reportData.topSarafs || []).map((saraf, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{saraf.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {saraf.transactions} تراکنش
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(saraf.volume, 'AFN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Transaction Types */}
            <Card>
              <CardHeader>
                <CardTitle>تراکنشها بر اساس نوع</CardTitle>
                <CardDescription>توزیع انواع تراکنشها</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(reportData.financial?.transactionsByType || []).map((type, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded"></div>
                        <span>{getTransactionTypeLabel(type.type)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{type._count} تراکنش</span>
                        <span className="font-bold">{Math.round((type._count / (reportData.transactions?.totalTransactions || 1)) * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">خطا در بارگذاری گزارشات</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}