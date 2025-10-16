'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Building2, MapPin, Phone, Edit, Trash2, Eye, DollarSign, Users, BarChart3, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { CitySearchFixed as CitySearch } from '@/components/ui/city-search-fixed'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

interface Branch {
  id: string
  name: string
  address: string
  phone: string
  city: string
  country: string
  isActive: boolean
  createdAt: string
  _count?: {
    transactions: number
  }
}

interface BranchTransaction {
  id: string
  referenceCode: string
  status: string
  fromAmount: number
  fromCurrency: string
  toAmount: number
  toCurrency: string
  senderName: string
  receiverName: string
  createdAt: string
}

export default function BranchesPage() {
  const { data: session } = useSession()
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [branchTransactions, setBranchTransactions] = useState<BranchTransaction[]>([])
  const [showTransactions, setShowTransactions] = useState(false)
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    city: '',
    country: 'Afghanistan'
  })

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/portal/branches')
      if (response.ok) {
        const data = await response.json()
        setBranches(data.branches || [])
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingBranch ? `/api/portal/branches/${editingBranch.id}` : '/api/portal/branches'
      const method = editingBranch ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowAddDialog(false)
        setEditingBranch(null)
        setFormData({
          name: '',
          address: '',
          phone: '',
          city: '',
          country: 'Afghanistan'
        })
        fetchBranches()
        toast({
          title: 'موفق',
          description: editingBranch ? 'شعبه بروزرسانی شد' : 'شعبه جدید ایجاد شد'
        })
      } else {
        throw new Error('Failed to save branch')
      }
    } catch (error) {
      console.error('Error saving branch:', error)
      toast({
        title: 'خطا',
        description: 'خطا در ذخیره شعبه',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch)
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      city: branch.city,
      country: branch.country
    })
    setShowAddDialog(true)
  }

  const handleDelete = async (branchId: string) => {
    if (!confirm('آیا از حذف این شعبه اطمینان دارید؟')) return
    
    try {
      const response = await fetch(`/api/portal/branches/${branchId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchBranches()
        toast({
          title: 'موفق',
          description: 'شعبه حذف شد'
        })
      } else {
        throw new Error('Failed to delete branch')
      }
    } catch (error) {
      console.error('Error deleting branch:', error)
      toast({
        title: 'خطا',
        description: 'خطا در حذف شعبه',
        variant: 'destructive'
      })
    }
  }

  const handleToggleActive = async (branch: Branch) => {
    try {
      const response = await fetch(`/api/portal/branches/${branch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !branch.isActive })
      })

      if (response.ok) {
        fetchBranches()
        toast({
          title: 'موفق',
          description: `شعبه ${branch.isActive ? 'غیرفعال' : 'فعال'} شد`
        })
      }
    } catch (error) {
      console.error('Error toggling branch status:', error)
      toast({
        title: 'خطا',
        description: 'خطا در تغییر وضعیت شعبه',
        variant: 'destructive'
      })
    }
  }

  const fetchBranchTransactions = async (branchId: string) => {
    try {
      const response = await fetch(`/api/portal/branches/${branchId}/transactions`)
      if (response.ok) {
        const data = await response.json()
        setBranchTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching branch transactions:', error)
    }
  }

  const viewBranchDetails = (branch: Branch) => {
    setSelectedBranch(branch)
    fetchBranchTransactions(branch.id)
    setShowTransactions(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />تکمیل شده</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />در انتظار</Badge>
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />لغو شده</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">مدیریت شعب</h1>
            <p className="text-muted-foreground">مدیریت شعب صرافی و نقاط خدماتی</p>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                شعبه جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingBranch ? 'ویرایش شعبه' : 'افزودن شعبه جدید'}</DialogTitle>
                <DialogDescription>
                  {editingBranch ? 'اطلاعات شعبه را بروزرسانی کنید' : 'اطلاعات شعبه جدید را وارد کنید'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">نام شعبه *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="مثال: شعبه مرکزی"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">آدرس *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="آدرس کامل شعبه"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">شماره تلفن *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="شماره تلفن شعبه"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="city">شهر *</Label>
                  <CitySearch
                    value={formData.city}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                    placeholder="انتخاب شهر"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    لغو
                  </Button>
                  <Button type="submit">
                    {editingBranch ? 'بروزرسانی' : 'ایجاد شعبه'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">کل شعب</p>
                  <p className="text-2xl font-bold">{branches.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">شعب فعال</p>
                  <p className="text-2xl font-bold">{branches.filter(b => b.isActive).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-muted-foreground">شعب غیرفعال</p>
                  <p className="text-2xl font-bold">{branches.filter(b => !b.isActive).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">کل تراکنشها</p>
                  <p className="text-2xl font-bold">
                    {branches.reduce((sum, b) => sum + (b._count?.transactions || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Branches List */}
        <Card>
          <CardHeader>
            <CardTitle>لیست شعب</CardTitle>
            <CardDescription>
              مدیریت شعب و نقاط خدماتی صرافی
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">در حال بارگذاری...</div>
            ) : branches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                هیچ شعبهای یافت نشد
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {branches.map((branch) => (
                  <Card key={branch.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{branch.name}</h3>
                          <Badge variant={branch.isActive ? 'default' : 'secondary'}>
                            {branch.isActive ? 'فعال' : 'غیرفعال'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span>{branch.address}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span>{branch.city}, {branch.country}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span>{branch.phone}</span>
                          </div>
                        </div>
                        
                        {branch._count && (
                          <div className="text-xs text-muted-foreground">
                            {branch._count.transactions} تراکنش
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <Switch
                            checked={branch.isActive}
                            onCheckedChange={() => handleToggleActive(branch)}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => viewBranchDetails(branch)}>
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(branch)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(branch.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branch Details Dialog */}
        <Dialog open={showTransactions} onOpenChange={setShowTransactions}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>جزئیات شعبه: {selectedBranch?.name}</DialogTitle>
              <DialogDescription>
                مشاهده تراکنشها و آمار شعبه
              </DialogDescription>
            </DialogHeader>
            
            {selectedBranch && (
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">اطلاعات شعبه</TabsTrigger>
                  <TabsTrigger value="transactions">تراکنشها ({branchTransactions.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span className="font-medium">{selectedBranch.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm text-muted-foreground">{selectedBranch.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span className="text-sm text-muted-foreground">{selectedBranch.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm text-muted-foreground">{selectedBranch.city}, {selectedBranch.country}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">وضعیت:</span>
                            <Badge variant={selectedBranch.isActive ? 'default' : 'secondary'}>
                              {selectedBranch.isActive ? 'فعال' : 'غیرفعال'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">تاریخ ایجاد:</span>
                            <span className="text-sm">{new Date(selectedBranch.createdAt).toLocaleDateString('fa-IR')}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">کل تراکنشها:</span>
                            <span className="text-sm font-bold">{selectedBranch._count?.transactions || 0}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="transactions" className="space-y-4">
                  {branchTransactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>هیچ تراکنشی در این شعبه یافت نشد</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {branchTransactions.map((transaction) => (
                        <Card key={transaction.id} className="border-l-4 border-l-green-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{transaction.referenceCode}</span>
                                {getStatusBadge(transaction.status)}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(transaction.createdAt).toLocaleDateString('fa-IR')}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">مبلغ و ارز</p>
                                <p className="font-medium">
                                  {transaction.fromAmount.toLocaleString()} {transaction.fromCurrency}
                                  {' → '}
                                  {transaction.toAmount.toLocaleString()} {transaction.toCurrency}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">فرستنده و گیرنده</p>
                                <p className="font-medium">{transaction.senderName} → {transaction.receiverName}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}