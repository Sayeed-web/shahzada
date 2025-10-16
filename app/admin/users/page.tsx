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
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, Search, Plus, Edit, Trash2, Eye, UserCheck, UserX } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: string
  isActive: boolean
  createdAt: string
  lastLogin?: string
  saraf?: {
    id: string
    businessName: string
    status: string
    rating: number
  }
  _count: {
    transactions: number
    notifications: number
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function AdminUsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkAction, setBulkAction] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    phone: '',
    role: 'USER',
    password: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [pagination.page, search, roleFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        role: roleFilter
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')

      const data = await response.json()
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (error) {
      setError('خطا در بارگذاری کاربران')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setSuccess('کاربر با موفقیت ایجاد شد')
      setShowCreateDialog(false)
      setNewUser({ email: '', name: '', phone: '', role: 'USER', password: '' })
      fetchUsers()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'خطا در ایجاد کاربر')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (!response.ok) throw new Error('Failed to update user')

      setSuccess(`کاربر ${!currentStatus ? 'فعال' : 'غیرفعال'} شد`)
      fetchUsers()
    } catch (error) {
      setError('خطا در بروزرسانی وضعیت کاربر')
    }
  }

  const handleBulkAction = async () => {
    if (selectedUsers.length === 0 || !bulkAction) return

    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers,
          action: bulkAction
        })
      })

      if (!response.ok) throw new Error('Failed to perform bulk action')

      setSuccess(`عملیات گروهی بر ${selectedUsers.length} کاربر انجام شد`)
      setSelectedUsers([])
      setShowBulkDialog(false)
      setBulkAction('')
      fetchUsers()
    } catch (error) {
      setError('خطا در انجام عملیات گروهی')
    }
  }

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(user => user.id))
    }
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      ADMIN: 'destructive',
      SARAF: 'default',
      USER: 'secondary'
    }
    const labels = {
      ADMIN: 'مدیر',
      SARAF: 'صراف',
      USER: 'کاربر'
    }
    return (
      <Badge variant={variants[role as keyof typeof variants] as any}>
        {labels[role as keyof typeof labels]}
      </Badge>
    )
  }

  const getStatusBadge = (isActive: boolean) => (
    <Badge variant={isActive ? 'default' : 'secondary'}>
      {isActive ? 'فعال' : 'غیرفعال'}
    </Badge>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              مدیریت کاربران
            </h1>
            <p className="text-muted-foreground">مشاهده و مدیریت تمام کاربران سیستم</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {selectedUsers.length > 0 && (
              <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    عملیات گروهی ({selectedUsers.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md">
                  <DialogHeader>
                    <DialogTitle>عملیات گروهی</DialogTitle>
                    <DialogDescription>
                      عملیات بر {selectedUsers.length} کاربر انتخاب شده
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Select value={bulkAction} onValueChange={setBulkAction}>
                      <SelectTrigger>
                        <SelectValue placeholder="عملیات را انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activate">فعال کردن</SelectItem>
                        <SelectItem value="deactivate">غیرفعال کردن</SelectItem>
                        <SelectItem value="delete">حذف</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                        لغو
                      </Button>
                      <Button onClick={handleBulkAction} disabled={!bulkAction}>
                        اجرا
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  کاربر جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>ایجاد کاربر جدید</DialogTitle>
                  <DialogDescription>اطلاعات کاربر جدید را وارد کنید</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <Label htmlFor="email">ایمیل *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">نام *</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">شماره تلفن</Label>
                    <Input
                      id="phone"
                      value={newUser.phone}
                      onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">نقش *</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">کاربر</SelectItem>
                        <SelectItem value="SARAF">صراف</SelectItem>
                        <SelectItem value="ADMIN">مدیر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="password">رمز عبور *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                      لغو
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'در حال ایجاد...' : 'ایجاد کاربر'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
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
                    placeholder="جستجو بر اساس نام، ایمیل یا تلفن..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">همه نقشها</SelectItem>
                  <SelectItem value="USER">کاربر</SelectItem>
                  <SelectItem value="SARAF">صراف</SelectItem>
                  <SelectItem value="ADMIN">مدیر</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>لیست کاربران ({pagination.total})</CardTitle>
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
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === users.length && users.length > 0}
                            onChange={handleSelectAll}
                            className="w-4 h-4"
                          />
                        </TableHead>
                        <TableHead className="min-w-[200px]">کاربر</TableHead>
                        <TableHead className="min-w-[100px]">نقش</TableHead>
                        <TableHead className="min-w-[80px]">وضعیت</TableHead>
                        <TableHead className="min-w-[80px] hidden sm:table-cell">تراکنشها</TableHead>
                        <TableHead className="min-w-[120px] hidden md:table-cell">تاریخ عضویت</TableHead>
                        <TableHead className="min-w-[120px] hidden lg:table-cell">آخرین ورود</TableHead>
                        <TableHead className="min-w-[100px]">عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleSelectUser(user.id)}
                              className="w-4 h-4"
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                              {user.phone && (
                                <div className="text-sm text-muted-foreground">{user.phone}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {getRoleBadge(user.role)}
                              {user.saraf && (
                                <div className="text-xs text-muted-foreground">
                                  {user.saraf.businessName}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                          <TableCell className="hidden sm:table-cell">{user._count.transactions}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {new Date(user.createdAt).toLocaleDateString('fa-IR')}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {user.lastLogin 
                              ? new Date(user.lastLogin).toLocaleDateString('fa-IR')
                              : 'هرگز'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                                className="min-w-[44px] h-9"
                              >
                                {user.isActive ? (
                                  <UserX className="h-4 w-4" />
                                ) : (
                                  <UserCheck className="h-4 w-4" />
                                )}
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
                    نمایش {((pagination.page - 1) * pagination.limit) + 1} تا {Math.min(pagination.page * pagination.limit, pagination.total)} از {pagination.total} کاربر
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
      </div>
    </DashboardLayout>
  )
}