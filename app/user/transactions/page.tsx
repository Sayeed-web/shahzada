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
import { ArrowLeft, Search, Filter, Download, Eye } from 'lucide-react'
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
  saraf?: {
    businessName: string
    user: { name: string }
  }
}

interface TransactionResponse {
  transactions: Transaction[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function UserTransactionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<TransactionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  const fetchTransactions = async () => {
    if (!session?.user?.id) return
    
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (statusFilter) params.append('status', statusFilter)
      if (typeFilter) params.append('type', typeFilter)
      
      const response = await fetch(`/api/user/transactions?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [session, page, statusFilter, typeFilter])

  if (status === 'loading' || !session) {
    return <div>در حال بارگذاری...</div>
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
        return <Badge className="bg-gray-100 text-gray-800">برداشت شده</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'HAWALA':
        return <Badge variant="outline">حواله</Badge>
      case 'EXCHANGE':
        return <Badge variant="outline">تبدیل ارز</Badge>
      case 'CRYPTO':
        return <Badge variant="outline">ارز دیجیتال</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const filteredTransactions = data?.transactions.filter(transaction =>
    transaction.referenceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.receiverName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/user">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">تاریخچه تراکنش‌ها</h1>
              <p className="text-muted-foreground">
                مشاهده و مدیریت تمام تراکنش‌های شما
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            دانلود گزارش
          </Button>
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
                  <SelectItem value="">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="PENDING">در انتظار</SelectItem>
                  <SelectItem value="COMPLETED">تکمیل شده</SelectItem>
                  <SelectItem value="CANCELLED">لغو شده</SelectItem>
                  <SelectItem value="WITHDRAWN">برداشت شده</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="نوع تراکنش" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">همه انواع</SelectItem>
                  <SelectItem value="HAWALA">حواله</SelectItem>
                  <SelectItem value="EXCHANGE">تبدیل ارز</SelectItem>
                  <SelectItem value="CRYPTO">ارز دیجیتال</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>
              تراکنش‌ها ({data?.pagination.total || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                در حال بارگذاری...
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>تراکنشی یافت نشد</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/hawala">اولین تراکنش خود را ثبت کنید</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{transaction.referenceCode}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getTypeBadge(transaction.type)}
                            {getStatusBadge(transaction.status)}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
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
                          نرخ: {transaction.rate.toLocaleString()}
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

                    {transaction.saraf && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground">
                          صراف: {transaction.saraf.businessName} ({transaction.saraf.user.name})
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  قبلی
                </Button>
                <span className="text-sm text-muted-foreground">
                  صفحه {page} از {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.pagination.totalPages}
                >
                  بعدی
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}