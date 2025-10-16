'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Star, Crown, Calendar, DollarSign, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface PromotionRequest {
  id: string
  sarafId: string
  type: 'PREMIUM' | 'FEATURED'
  duration: number
  amount: number
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'HAWALA'
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
  createdAt: string
  expiresAt?: string
  saraf: {
    businessName: string
    businessPhone: string
    user: {
      name: string
      email: string
    }
  }
}

export default function AdminPromotionsPage() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<PromotionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<PromotionRequest | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  useEffect(() => {
    fetchPromotionRequests()
  }, [])

  const fetchPromotionRequests = async () => {
    try {
      const response = await fetch('/api/admin/promotions')
      if (!response.ok) throw new Error('Failed to fetch promotion requests')
      const data = await response.json()
      setRequests(data)
    } catch (error) {
      toast.error('خطا در بارگذاری درخواستهای ارتقاء')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/promotions/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update promotion request')

      toast.success(`درخواست ${newStatus === 'APPROVED' ? 'تایید' : 'رد'} شد`)
      fetchPromotionRequests()
    } catch (error) {
      toast.error('خطا در بروزرسانی وضعیت درخواست')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: 'secondary',
      APPROVED: 'default',
      REJECTED: 'destructive',
      PAID: 'default'
    }
    const labels = {
      PENDING: 'در انتظار',
      APPROVED: 'تایید شده',
      REJECTED: 'رد شده',
      PAID: 'پرداخت شده'
    }
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    return type === 'PREMIUM' ? (
      <Badge className="bg-yellow-100 text-yellow-800">
        <Crown className="h-3 w-3 mr-1" />
        پریمیوم
      </Badge>
    ) : (
      <Badge className="bg-blue-100 text-blue-800">
        <Star className="h-3 w-3 mr-1" />
        ویژه
      </Badge>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Crown className="h-6 w-6" />
              مدیریت ارتقاء صرافان
            </h1>
            <p className="text-muted-foreground">بررسی و تایید درخواستهای ارتقاء به حساب پریمیوم</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">در انتظار بررسی</p>
                  <p className="text-2xl font-bold">
                    {requests.filter(r => r.status === 'PENDING').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">تایید شده</p>
                  <p className="text-2xl font-bold">
                    {requests.filter(r => r.status === 'APPROVED').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">درآمد کل</p>
                  <p className="text-2xl font-bold persian-numbers">
                    {requests
                      .filter(r => r.status === 'PAID')
                      .reduce((sum, r) => sum + r.amount, 0)
                      .toLocaleString()} AFN
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">صرافان پریمیوم</p>
                  <p className="text-2xl font-bold">
                    {requests.filter(r => r.status === 'PAID' && r.type === 'PREMIUM').length}
                  </p>
                </div>
                <Crown className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Promotion Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>درخواستهای ارتقاء ({requests.length})</CardTitle>
            <CardDescription>
              درخواستهای ارتقاء صرافان به حساب پریمیوم با پرداخت محلی
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">در حال بارگذاری...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">صراف</TableHead>
                      <TableHead className="min-w-[100px]">نوع ارتقاء</TableHead>
                      <TableHead className="min-w-[100px] hidden sm:table-cell">مدت زمان</TableHead>
                      <TableHead className="min-w-[120px]">مبلغ</TableHead>
                      <TableHead className="min-w-[120px] hidden md:table-cell">روش پرداخت</TableHead>
                      <TableHead className="min-w-[100px]">وضعیت</TableHead>
                      <TableHead className="min-w-[120px] hidden lg:table-cell">تاریخ درخواست</TableHead>
                      <TableHead className="min-w-[150px]">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.saraf.businessName}</div>
                            <div className="text-sm text-muted-foreground">
                              {request.saraf.user.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.saraf.businessPhone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(request.type)}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span className="persian-numbers">{request.duration} روز</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium persian-numbers">
                            {request.amount.toLocaleString()} AFN
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">
                            {request.paymentMethod === 'CASH' ? 'نقدی' :
                             request.paymentMethod === 'BANK_TRANSFER' ? 'انتقال بانکی' : 'حواله'}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {new Date(request.createdAt).toLocaleDateString('fa-IR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {request.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-600 min-w-[44px] h-9"
                                  onClick={() => handleStatusChange(request.id, 'APPROVED')}
                                >
                                  تایید
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 min-w-[44px] h-9"
                                  onClick={() => handleStatusChange(request.id, 'REJECTED')}
                                >
                                  رد
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request)
                                setShowDetailsDialog(true)
                              }}
                              className="min-w-[44px] h-9"
                            >
                              جزئیات
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>جزئیات درخواست ارتقاء</DialogTitle>
              <DialogDescription>اطلاعات کامل درخواست ارتقاء</DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">اطلاعات صراف</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>نام کسب و کار:</strong> {selectedRequest.saraf.businessName}</div>
                      <div><strong>نام مالک:</strong> {selectedRequest.saraf.user.name}</div>
                      <div><strong>ایمیل:</strong> {selectedRequest.saraf.user.email}</div>
                      <div><strong>تلفن:</strong> {selectedRequest.saraf.businessPhone}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">جزئیات درخواست</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>نوع ارتقاء:</strong> {selectedRequest.type === 'PREMIUM' ? 'پریمیوم' : 'ویژه'}</div>
                      <div><strong>مدت زمان:</strong> {selectedRequest.duration} روز</div>
                      <div><strong>مبلغ:</strong> {selectedRequest.amount.toLocaleString()} AFN</div>
                      <div><strong>روش پرداخت:</strong> {
                        selectedRequest.paymentMethod === 'CASH' ? 'نقدی' :
                        selectedRequest.paymentMethod === 'BANK_TRANSFER' ? 'انتقال بانکی' : 'حواله'
                      }</div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">راهنمای پرداخت محلی</h4>
                  <div className="bg-blue-50 p-4 rounded-lg text-sm">
                    <p><strong>برای پرداخت نقدی:</strong> مراجعه به دفتر مرکزی سرای شهزاده</p>
                    <p><strong>برای انتقال بانکی:</strong> حساب شماره 1234567890 بانک افغانستان</p>
                    <p><strong>برای حواله:</strong> کد حواله: HW{selectedRequest.id.slice(-6)}</p>
                  </div>
                </div>

                {selectedRequest.expiresAt && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>تاریخ انقضاء: {new Date(selectedRequest.expiresAt).toLocaleDateString('fa-IR')}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}