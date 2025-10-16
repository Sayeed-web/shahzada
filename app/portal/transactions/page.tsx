'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Search, Filter, Eye, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface Transaction {
  id: string
  referenceCode: string
  type: string
  status: string
  fromCurrency: string
  toCurrency: string
  fromAmount: number
  toAmount: number
  rate: number
  fee: number
  senderName: string
  receiverName: string
  receiverCity: string
  createdAt: string
  completedAt?: string
}

export default function PortalTransactionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (session.user.role !== 'SARAF') {
      router.push('/')
      return
    }
  }, [session, status, router])

  const fetchTransactions = async () => {
    if (!session?.user?.sarafId) return
    
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/portal/transactions?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      toast({
        title: 'خطا',
        description: 'دریافت تراکنشها با خطا مواجه شد',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [session, page, statusFilter, searchTerm])

  const handleStatusUpdate = async (transactionId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/portal/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: transactionId,
          status: newStatus
        })
      })

      if (response.ok) {
        toast({
          title: 'موفق',
          description: 'وضعیت تراکنش بروزرسانی شد'
        })
        fetchTransactions()
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      toast({
        title: 'خطا',
        description: 'بروزرسانی وضعیت با خطا مواجه شد',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">تکمیل شده</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">در انتظار</Badge>
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800">لغو شده</Badge>
      case 'WITHDRAWN':
        return <Badge className="bg-blue-100 text-blue-800">برداشت شده</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (status === 'loading' || !session) {
    return <div>در حال بارگذاری...</div>
  }

  if (session.user.role !== 'SARAF') {
    return <div>دسترسی غیرمجاز</div>
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/portal">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">مدیریت تراکنشها</h1>
            <p className="text-muted-foreground">مشاهده و مدیریت تراکنشهای صرافی</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="جستجو بر اساس کد پیگیری، نام فرستنده یا گیرنده..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="وضعیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">همه وضعیتها</SelectItem>
                  <SelectItem value="PENDING">در انتظار</SelectItem>
                  <SelectItem value="COMPLETED">تکمیل شده</SelectItem>
                  <SelectItem value="CANCELLED">لغو شده</SelectItem>
                  <SelectItem value="WITHDRAWN">برداشت شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>تراکنشها ({transactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">در حال بارگذاری...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>تراکنشی یافت نشد</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/portal/hawala/new">اولین تراکنش خود را ایجاد کنید</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{transaction.referenceCode}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(transaction.status)}
                            <Badge variant="outline">{transaction.type}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {transaction.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(transaction.id, 'COMPLETED')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              تایید
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(transaction.id, 'CANCELLED')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              لغو
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">مبلغ و ارز</p>
                        <p className="font-medium">
                          {transaction.fromAmount.toLocaleString()} {transaction.fromCurrency}
                          {' → '}
                          {transaction.toAmount.toLocaleString()} {transaction.toCurrency}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          نرخ: {transaction.rate.toLocaleString()} | کارمزد: {transaction.fee.toLocaleString()}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground">فرستنده و گیرنده</p>
                        <p className="font-medium">{transaction.senderName}</p>
                        <p className="text-xs text-muted-foreground">
                          به {transaction.receiverName} - {transaction.receiverCity}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground">تاریخ</p>
                        <p className="font-medium">
                          {new Date(transaction.createdAt).toLocaleDateString('fa-IR')}
                        </p>
                        {transaction.completedAt && (
                          <p className="text-xs text-muted-foreground">
                            تکمیل: {new Date(transaction.completedAt).toLocaleDateString('fa-IR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}