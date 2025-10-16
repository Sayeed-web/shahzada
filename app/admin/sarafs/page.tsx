'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building, Search, Check, X, Eye, Star } from 'lucide-react'

interface Saraf {
  id: string
  businessName: string
  businessAddress: string
  businessPhone: string
  licenseNumber?: string
  status: string
  isActive: boolean
  isPremium: boolean
  rating: number
  totalTransactions: number
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    phone?: string
    isActive: boolean
    lastLogin?: string
  }
  _count: {
    transactions: number
    rates: number
    documents: number
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function AdminSarafsPage() {
  const { data: session } = useSession()
  const [sarafs, setSarafs] = useState<Saraf[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedSaraf, setSelectedSaraf] = useState<Saraf | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchSarafs()
  }, [pagination.page, search, statusFilter])

  const fetchSarafs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        status: statusFilter
      })

      const response = await fetch(`/api/admin/sarafs?${params}`)
      if (!response.ok) throw new Error('Failed to fetch sarafs')

      const data = await response.json()
      setSarafs(data.sarafs)
      setPagination(data.pagination)
    } catch (error) {
      setError('خطا در بارگذاری صرافان')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (sarafId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/sarafs/${sarafId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update saraf')

      const statusLabels = {
        APPROVED: 'تایید شد',
        REJECTED: 'رد شد',
        SUSPENDED: 'تعلیق شد'
      }

      setSuccess(`صراف ${statusLabels[newStatus as keyof typeof statusLabels]}`)
      fetchSarafs()
    } catch (error) {
      setError('خطا در بروزرسانی وضعیت صراف')
    }
  }

  const handleTogglePremium = async (sarafId: string, currentPremium: boolean) => {
    try {
      const response = await fetch(`/api/admin/sarafs/${sarafId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPremium: !currentPremium })
      })

      if (!response.ok) throw new Error('Failed to update saraf')

      setSuccess(`صراف ${!currentPremium ? 'پریمیوم' : 'عادی'} شد`)
      fetchSarafs()
    } catch (error) {
      setError('خطا در بروزرسانی وضعیت پریمیوم')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: 'secondary',
      APPROVED: 'default',
      REJECTED: 'destructive',
      SUSPENDED: 'outline'
    }
    const labels = {
      PENDING: 'در انتظار',
      APPROVED: 'تایید شده',
      REJECTED: 'رد شده',
      SUSPENDED: 'تعلیق شده'
    }
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">({rating.toFixed(1)})</span>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Building className="h-6 w-6" />
              مدیریت صرافان
            </h1>
            <p className="text-muted-foreground">مشاهده و مدیریت تمام صرافان سیستم</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>فیلترها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="جستجو بر اساس نام کسب و کار، نام کاربر یا ایمیل..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">همه وضعیتها</SelectItem>
                  <SelectItem value="PENDING">در انتظار</SelectItem>
                  <SelectItem value="APPROVED">تایید شده</SelectItem>
                  <SelectItem value="REJECTED">رد شده</SelectItem>
                  <SelectItem value="SUSPENDED">تعلیق شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sarafs Table */}
        <Card>
          <CardHeader>
            <CardTitle>لیست صرافان ({pagination.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">در حال بارگذاری...</div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">کسب و کار</TableHead>
                        <TableHead className="min-w-[150px] hidden md:table-cell">مالک</TableHead>
                        <TableHead className="min-w-[100px]">وضعیت</TableHead>
                        <TableHead className="min-w-[120px] hidden sm:table-cell">امتیاز</TableHead>
                        <TableHead className="min-w-[100px] hidden lg:table-cell">تراکنشها</TableHead>
                        <TableHead className="min-w-[120px] hidden xl:table-cell">تاریخ ثبت نام</TableHead>
                        <TableHead className="min-w-[150px]">عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sarafs.map((saraf) => (
                        <TableRow key={saraf.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {saraf.businessName}
                                {saraf.isPremium && (
                                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                    پریمیوم
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">{saraf.businessPhone}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">{saraf.businessAddress}</div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div>
                              <div className="font-medium">{saraf.user.name}</div>
                              <div className="text-sm text-muted-foreground">{saraf.user.email}</div>
                              {saraf.user.phone && (
                                <div className="text-sm text-muted-foreground">{saraf.user.phone}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(saraf.status)}</TableCell>
                          <TableCell className="hidden sm:table-cell">{getRatingStars(saraf.rating)}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="text-center">
                              <div className="font-medium">{saraf._count.transactions}</div>
                              <div className="text-xs text-muted-foreground">
                                {saraf._count.rates} نرخ فعال
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {new Date(saraf.createdAt).toLocaleDateString('fa-IR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {saraf.status === 'PENDING' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 border-green-600 hover:bg-green-50 min-w-[44px] h-9"
                                    onClick={() => handleStatusChange(saraf.id, 'APPROVED')}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50 min-w-[44px] h-9"
                                    onClick={() => handleStatusChange(saraf.id, 'REJECTED')}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              
                              {saraf.status === 'APPROVED' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={`min-w-[44px] h-9 ${saraf.isPremium ? "text-gray-600" : "text-yellow-600 border-yellow-600"}`}
                                  onClick={() => handleTogglePremium(saraf.id, saraf.isPremium)}
                                >
                                  <Star className="h-4 w-4" />
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedSaraf(saraf)
                                  setShowDetailsDialog(true)
                                }}
                                className="min-w-[44px] h-9"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground text-center sm:text-left">
                    نمایش {((pagination.page - 1) * pagination.limit) + 1} تا {Math.min(pagination.page * pagination.limit, pagination.total)} از {pagination.total} صراف
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      className="min-w-[44px] h-9"
                    >
                      قبلی
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      className="min-w-[44px] h-9"
                    >
                      بعدی
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saraf Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>جزئیات صراف</DialogTitle>
              <DialogDescription>اطلاعات کامل صراف</DialogDescription>
            </DialogHeader>
            {selectedSaraf && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">اطلاعات کسب و کار</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>نام:</strong> {selectedSaraf.businessName}</div>
                      <div><strong>آدرس:</strong> {selectedSaraf.businessAddress}</div>
                      <div><strong>تلفن:</strong> {selectedSaraf.businessPhone}</div>
                      {selectedSaraf.licenseNumber && (
                        <div><strong>شماره مجوز:</strong> {selectedSaraf.licenseNumber}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">اطلاعات مالک</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>نام:</strong> {selectedSaraf.user.name}</div>
                      <div><strong>ایمیل:</strong> {selectedSaraf.user.email}</div>
                      {selectedSaraf.user.phone && (
                        <div><strong>تلفن:</strong> {selectedSaraf.user.phone}</div>
                      )}
                      <div><strong>آخرین ورود:</strong> {
                        selectedSaraf.user.lastLogin 
                          ? new Date(selectedSaraf.user.lastLogin).toLocaleDateString('fa-IR')
                          : 'هرگز'
                      }</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedSaraf._count.transactions}</div>
                    <div className="text-sm text-muted-foreground">تراکنش</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedSaraf._count.rates}</div>
                    <div className="text-sm text-muted-foreground">نرخ فعال</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedSaraf.rating.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">امتیاز</div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}