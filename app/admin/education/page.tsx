'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { BookOpen, Plus, Edit, Trash2, Eye, EyeOff, RefreshCw, Star, Users, Clock, DollarSign, Tag, Globe, Newspaper, Upload, Download, BarChart3, Settings, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Course {
  id: string
  title: string
  description: string
  category: string
  level: string
  duration: number
  price: number
  isPremium: boolean
  isPublished: boolean
  thumbnailUrl?: string
  videoUrl?: string
  content: string
  tags: string[]
  rating: number
  enrollments: number
  createdAt: string
  updatedAt: string
}

interface TechNews {
  id: string
  title: string
  description: string
  content: string
  source: string
  url: string
  imageUrl?: string
  publishedAt: string
  isActive: boolean
  createdAt: string
}

export default function AdminEducationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [courses, setCourses] = useState<Course[]>([])
  const [techNews, setTechNews] = useState<TechNews[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [selectedNews, setSelectedNews] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'finance',
    level: 'beginner',
    duration: 30,
    price: 0,
    isPremium: false,
    isPublished: false,
    thumbnailUrl: '',
    videoUrl: '',
    content: '',
    tags: ''
  })

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
    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [coursesRes, newsRes] = await Promise.all([
        fetch('/api/admin/education/courses'),
        fetch('/api/admin/education/tech-news')
      ])

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        setCourses(coursesData)
      }

      if (newsRes.ok) {
        const newsData = await newsRes.json()
        setTechNews(newsData)
      }
    } catch (error) {
      console.error('Failed to fetch education data:', error)
      toast.error('خطا در بارگذاری اطلاعات')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCourse = async () => {
    if (!formData.title || !formData.description || !formData.content) {
      toast.error('لطفاً تمام فیلدهای اجباری را پر کنید')
      return
    }

    try {
      const courseData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        duration: parseInt(formData.duration.toString()) || 30,
        price: parseFloat(formData.price.toString()) || 0
      }

      const response = await fetch('/api/admin/education/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData)
      })

      if (response.ok) {
        const newCourse = await response.json()
        setCourses(prev => [newCourse, ...prev])
        setIsCreateDialogOpen(false)
        resetForm()
        toast.success('دوره با موفقیت ایجاد شد')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'خطا در ایجاد دوره')
      }
    } catch (error) {
      console.error('Course creation error:', error)
      toast.error('خطا در اتصال به سرور')
    }
  }

  const handleEditCourse = async () => {
    if (!selectedCourse || !formData.title || !formData.description || !formData.content) {
      toast.error('لطفاً تمام فیلدهای اجباری را پر کنید')
      return
    }

    try {
      const courseData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        duration: parseInt(formData.duration.toString()) || 30,
        price: parseFloat(formData.price.toString()) || 0
      }

      const response = await fetch(`/api/admin/education/courses/${selectedCourse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData)
      })

      if (response.ok) {
        const updatedCourse = await response.json()
        setCourses(prev => prev.map(c => c.id === selectedCourse.id ? updatedCourse : c))
        setIsEditDialogOpen(false)
        setSelectedCourse(null)
        resetForm()
        toast.success('دوره با موفقیت بروزرسانی شد')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'خطا در بروزرسانی دوره')
      }
    } catch (error) {
      console.error('Course update error:', error)
      toast.error('خطا در اتصال به سرور')
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('آیا از حذف این دوره اطمینان دارید؟')) return

    try {
      const response = await fetch(`/api/admin/education/courses/${courseId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCourses(prev => prev.filter(c => c.id !== courseId))
        toast.success('دوره با موفقیت حذف شد')
      } else {
        toast.error('خطا در حذف دوره')
      }
    } catch (error) {
      console.error('Course deletion error:', error)
      toast.error('خطا در اتصال به سرور')
    }
  }

  const openEditDialog = (course: Course) => {
    setSelectedCourse(course)
    setFormData({
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      duration: course.duration,
      price: course.price,
      isPremium: course.isPremium,
      isPublished: course.isPublished,
      thumbnailUrl: course.thumbnailUrl || '',
      videoUrl: course.videoUrl || '',
      content: course.content,
      tags: Array.isArray(course.tags) ? course.tags.join(', ') : (typeof course.tags === 'string' ? JSON.parse(course.tags || '[]').join(', ') : '')
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'finance',
      level: 'beginner',
      duration: 30,
      price: 0,
      isPremium: false,
      isPublished: false,
      thumbnailUrl: '',
      videoUrl: '',
      content: '',
      tags: ''
    })
  }

  if (status === 'loading' || !session) {
    return <div>در حال بارگذاری...</div>
  }

  if (session.user.role !== 'ADMIN') {
    return <div>دسترسی غیرمجاز</div>
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text">مدیریت آموزش</h1>
            <p className="text-muted-foreground">مدیریت کامل دورهها، اخبار فناوری و محتوای آموزشی</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => {
              const csvData = courses.map(course => ({
                title: course.title,
                category: course.category,
                level: course.level,
                price: course.price,
                enrollments: course.enrollments,
                rating: course.rating,
                published: course.isPublished ? 'بله' : 'خیر',
                premium: course.isPremium ? 'بله' : 'خیر'
              }))
              const csv = 'data:text/csv;charset=utf-8,' + encodeURIComponent(
                Object.keys(csvData[0] || {}).join(',') + '\n' +
                csvData.map(row => Object.values(row).join(',')).join('\n')
              )
              const link = document.createElement('a')
              link.href = csv
              link.download = 'courses-report.csv'
              link.click()
            }} className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              گزارش Excel
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              دوره جدید
            </Button>
          </div>
        </div>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              دورهها
            </TabsTrigger>
            <TabsTrigger value="tech-news" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              اخبار فناوری
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              آمار و گزارش
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">کل دورهها</p>
                      <p className="text-2xl font-bold">{courses.length}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">دورههای منتشر شده</p>
                      <p className="text-2xl font-bold">{courses.filter(c => c.isPublished).length}</p>
                    </div>
                    <Eye className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">دورههای پریمیوم</p>
                      <p className="text-2xl font-bold">{courses.filter(c => c.isPremium).length}</p>
                    </div>
                    <Star className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">کل ثبتنامها</p>
                      <p className="text-2xl font-bold">{courses.reduce((sum, c) => sum + c.enrollments, 0)}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">در حال بارگذاری...</div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    هیچ دورهای یافت نشد
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courses.map((course) => (
                      <div key={course.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="font-semibold">{course.title}</h3>
                              <div className="flex gap-1">
                                {course.isPublished ? (
                                  <Badge className="bg-green-100 text-green-800">منتشر شده</Badge>
                                ) : (
                                  <Badge variant="secondary">پیشنویس</Badge>
                                )}
                                {course.isPremium && (
                                  <Badge className="bg-yellow-100 text-yellow-800">پریمیوم</Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {course.category}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {course.duration} دقیقه
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {course.price === 0 ? 'رایگان' : `${course.price} افغانی`}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {course.enrollments} ثبتنام
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {course.rating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(course)}
                              className="min-w-[44px] h-9"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteCourse(course.id)}
                              className="text-red-600 border-red-600 hover:bg-red-50 min-w-[44px] h-9"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tech-news" className="space-y-6">
            <Card>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  اخبار فناوری در حال توسعه است
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  آمار و گزارشات در حال توسعه است
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Course Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ایجاد دوره جدید</DialogTitle>
              <DialogDescription>
                اطلاعات دوره آموزشی جدید را وارد کنید
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">عنوان دوره</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="عنوان دوره را وارد کنید"
                  />
                </div>
                <div>
                  <Label htmlFor="category">دستهبندی</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="finance">مالی</SelectItem>
                      <SelectItem value="trading">معاملات</SelectItem>
                      <SelectItem value="crypto">ارزهای دیجیتال</SelectItem>
                      <SelectItem value="hawala">حواله</SelectItem>
                      <SelectItem value="business">کسب و کار</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">توضیحات</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="توضیحات دوره را وارد کنید"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="videoUrl">لینک ویدیو یوتیوب</Label>
                  <Input
                    id="videoUrl"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://youtu.be/... یا https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">لینک ویدیو یا پلی لیست یوتیوب</p>
                </div>
                <div>
                  <Label htmlFor="thumbnailUrl">لینک تصویر</Label>
                  <Input
                    id="thumbnailUrl"
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">تصویر شاخص دوره (اختیاری)</p>
                </div>
              </div>

              <div>
                <Label htmlFor="content">محتوای دوره</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="محتوای کامل دوره را وارد کنید یا لینک یوتیوب"
                  rows={5}
                />
                <p className="text-xs text-muted-foreground mt-1">میتوانید لینک یوتیوب، توضیحات یا محتوای متنی وارد کنید</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="level">سطح</Label>
                  <Select value={formData.level} onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">مبتدی</SelectItem>
                      <SelectItem value="intermediate">متوسط</SelectItem>
                      <SelectItem value="advanced">پیشرفته</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration">مدت زمان (دقیقه)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="price">قیمت (افغانی)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tags">برچسبها</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="برچسبها را با کاما جدا کنید"
                />
                <p className="text-xs text-muted-foreground mt-1">مثال: آموزش، کریپتو، معاملات</p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="isPremium"
                    checked={formData.isPremium}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPremium: checked }))}
                  />
                  <Label htmlFor="isPremium">دوره پریمیوم</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="isPublished"
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublished: checked }))}
                  />
                  <Label htmlFor="isPublished">انتشار دوره</Label>
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto">
                انصراف
              </Button>
              <Button onClick={handleCreateCourse} className="w-full sm:w-auto">
                ایجاد دوره
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Course Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ویرایش دوره</DialogTitle>
              <DialogDescription>
                اطلاعات دوره آموزشی را ویرایش کنید
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">عنوان دوره</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="عنوان دوره را وارد کنید"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">دستهبندی</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="finance">مالی</SelectItem>
                      <SelectItem value="trading">معاملات</SelectItem>
                      <SelectItem value="crypto">ارزهای دیجیتال</SelectItem>
                      <SelectItem value="hawala">حواله</SelectItem>
                      <SelectItem value="business">کسب و کار</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-description">توضیحات</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="توضیحات دوره را وارد کنید"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit-content">محتوای دوره</Label>
                <Textarea
                  id="edit-content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="محتوای کامل دوره را وارد کنید یا لینک یوتیوب"
                  rows={5}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="edit-isPremium"
                    checked={formData.isPremium}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPremium: checked }))}
                  />
                  <Label htmlFor="edit-isPremium">دوره پریمیوم</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="edit-isPublished"
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublished: checked }))}
                  />
                  <Label htmlFor="edit-isPublished">انتشار دوره</Label>
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto">
                انصراف
              </Button>
              <Button onClick={handleEditCourse} className="w-full sm:w-auto">
                بروزرسانی دوره
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}