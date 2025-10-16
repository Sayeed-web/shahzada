'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Globe, Plus, Edit, Trash2, Eye, Video, Facebook, ExternalLink, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface ContentItem {
  id: string
  title: string
  type: 'IFRAME' | 'VIDEO' | 'FACEBOOK' | 'ANNOUNCEMENT'
  content: string
  url?: string
  isActive: boolean
  position: string
  createdAt: string
  updatedAt: string
}

export default function AdminContentPage() {
  const { data: session } = useSession()
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    type: 'IFRAME' as ContentItem['type'],
    content: '',
    url: '',
    position: 'DASHBOARD',
    isActive: true
  })

  useEffect(() => {
    fetchContentItems()
  }, [])

  const fetchContentItems = async () => {
    try {
      const response = await fetch(`/api/admin/content?_t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch content')
      const data = await response.json()
      console.log('Fetched content items:', data.length)
      setContentItems(data)
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error('خطا در بارگذاری محتوا')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const method = editingItem ? 'PUT' : 'POST'
      const body = editingItem 
        ? { ...formData, id: editingItem.id }
        : formData

      console.log('Submitting:', method, body)

      const response = await fetch('/api/admin/content', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to save content')
      }

      const result = await response.json()
      console.log('Save result:', result)
      
      // Clear cache
      try {
        await fetch('/api/admin/clear-content-cache', { method: 'POST' })
      } catch (cacheError) {
        console.warn('Cache clear failed:', cacheError)
      }

      toast.success(editingItem ? 'محتوا بروزرسانی شد' : 'محتوا ایجاد شد')
      setShowCreateDialog(false)
      setEditingItem(null)
      resetForm()
      
      // Refresh content list
      setTimeout(() => fetchContentItems(), 500)
    } catch (error) {
      console.error('Save error:', error)
      toast.error('خطا در ذخیره محتوا: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این محتوا اطمینان دارید؟')) return

    try {
      setLoading(true)
      
      // First try the admin content API
      const response = await fetch(`/api/admin/content?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        // Try the individual content API as fallback
        const fallbackResponse = await fetch(`/api/admin/content/${id}`, {
          method: 'DELETE'
        })
        
        if (!fallbackResponse.ok) {
          const errorData = await fallbackResponse.json()
          throw new Error(errorData.error || 'Failed to delete content')
        }
      }
      
      // Clear cache
      try {
        await fetch('/api/admin/clear-content-cache', { method: 'POST' })
      } catch (cacheError) {
        console.warn('Cache clear failed:', cacheError)
      }

      toast.success('محتوا حذف شد')
      
      // Remove from local state immediately
      setContentItems(prev => prev.filter(item => item.id !== id))
      
      // Refresh from server
      setTimeout(() => fetchContentItems(), 500)
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('خطا در حذف محتوا: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'IFRAME',
      content: '',
      url: '',
      position: 'DASHBOARD',
      isActive: true
    })
  }

  const handleEdit = (item: ContentItem) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      type: item.type,
      content: item.content,
      url: item.url || '',
      position: item.position,
      isActive: item.isActive
    })
    setShowCreateDialog(true)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IFRAME': return <Globe className="h-4 w-4" />
      case 'VIDEO': return <Video className="h-4 w-4" />
      case 'FACEBOOK': return <Facebook className="h-4 w-4" />
      default: return <Globe className="h-4 w-4" />
    }
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      IFRAME: 'bg-blue-100 text-blue-800',
      VIDEO: 'bg-red-100 text-red-800',
      FACEBOOK: 'bg-blue-100 text-blue-800',
      ANNOUNCEMENT: 'bg-green-100 text-green-800'
    }
    const labels = {
      IFRAME: 'صفحه وب',
      VIDEO: 'ویدیو',
      FACEBOOK: 'فیسبوک',
      ANNOUNCEMENT: 'اعلان'
    }
    return (
      <Badge className={colors[type as keyof typeof colors]}>
        {labels[type as keyof typeof labels]}
      </Badge>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Globe className="h-5 w-5 sm:h-6 sm:w-6" />
              مدیریت محتوا
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">مدیریت محتوای نمایشی در داشبورد</p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                محتوای جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl mx-4 sm:mx-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'ویرایش محتوا' : 'ایجاد محتوای جدید'}
                </DialogTitle>
                <DialogDescription>
                  محتوای جدید برای نمایش در داشبورد ایجاد کنید
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-sm">عنوان *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type" className="text-sm">نوع محتوا *</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as ContentItem['type'] }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IFRAME">صفحه وب (iframe)</SelectItem>
                        <SelectItem value="VIDEO">ویدیو یوتیوب</SelectItem>
                        <SelectItem value="FACEBOOK">پست فیسبوک</SelectItem>
                        <SelectItem value="ANNOUNCEMENT">اعلان متنی</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(formData.type === 'IFRAME' || formData.type === 'VIDEO' || formData.type === 'FACEBOOK') && (
                  <div>
                    <Label htmlFor="url" className="text-sm">آدرس URL *</Label>
                    <Input
                      id="url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      placeholder={
                        formData.type === 'VIDEO' ? 'https://www.youtube.com/watch?v=...' :
                        formData.type === 'FACEBOOK' ? 'https://www.facebook.com/...' :
                        'https://example.com'
                      }
                      required
                      className="mt-1 text-sm"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="content" className="text-sm">محتوا / توضیحات</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={3}
                    placeholder="توضیحات اضافی یا محتوای متنی..."
                    className="mt-1 text-sm"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} className="w-full sm:w-auto">
                    لغو
                  </Button>
                  <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                    {loading ? 'در حال ذخیره...' : editingItem ? 'بروزرسانی' : 'ایجاد'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>محتوای موجود ({contentItems.length})</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchContentItems()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                بروزرسانی
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">در حال بارگذاری...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">عنوان</TableHead>
                      <TableHead className="hidden sm:table-cell">نوع</TableHead>
                      <TableHead className="hidden md:table-cell">وضعیت</TableHead>
                      <TableHead className="hidden lg:table-cell">تاریخ ایجاد</TableHead>
                      <TableHead className="min-w-[100px]">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {contentItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          {getTypeIcon(item.type)}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm sm:text-base">{item.title}</div>
                            <div className="sm:hidden mt-1">
                              {getTypeBadge(item.type)}
                            </div>
                            <div className="md:hidden mt-1">
                              <Badge variant={item.isActive ? 'default' : 'secondary'} className="text-xs">
                                {item.isActive ? 'فعال' : 'غیرفعال'}
                              </Badge>
                            </div>
                            {item.url && (
                              <div className="text-xs sm:text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-xs mt-1">
                                {item.url}
                              </div>
                            )}
                            <div className="lg:hidden text-xs text-muted-foreground mt-1">
                              {new Date(item.createdAt).toLocaleDateString('fa-IR')}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{getTypeBadge(item.type)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={item.isActive ? 'default' : 'secondary'}>
                          {item.isActive ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {new Date(item.createdAt).toLocaleDateString('fa-IR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 sm:gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                            className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline ml-2">ویرایش</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(item.id)}
                            className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline ml-2">حذف</span>
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
      </div>
    </DashboardLayout>
  )
}