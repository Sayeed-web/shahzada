'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, Users, DollarSign, BookOpen, Star, Clock, Eye } from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalCourses: number
    publishedCourses: number
    premiumCourses: number
    totalEnrollments: number
    totalRevenue: number
    averageRating: number
    completionRate: number
  }
  coursesByCategory: Array<{ category: string; count: number }>
  topPerformingCourses: Array<{
    id: string
    title: string
    enrollments: number
    rating: number
    price: number
  }>
  recentActivity: Array<{
    action: string
    timestamp: string
    details: any
  }>
}

export function EducationAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/education/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        // Fallback to mock data if API fails
        const mockData: AnalyticsData = {
          overview: {
            totalCourses: 0,
            publishedCourses: 0,
            premiumCourses: 0,
            totalEnrollments: 0,
            totalRevenue: 0,
            averageRating: 0,
            completionRate: 0
          },
          coursesByCategory: [],
          topPerformingCourses: [],
          recentActivity: []
        }
        setAnalytics(mockData)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      // Fallback to empty data
      setAnalytics({
        overview: {
          totalCourses: 0,
          publishedCourses: 0,
          premiumCourses: 0,
          totalEnrollments: 0,
          totalRevenue: 0,
          averageRating: 0,
          completionRate: 0
        },
        coursesByCategory: [],
        topPerformingCourses: [],
        recentActivity: []
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      finance: 'مالی',
      trading: 'معاملات',
      crypto: 'ارزهای دیجیتال',
      hawala: 'حواله',
      business: 'کسب و کار'
    }
    return labels[category] || category
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">کل دورهها</p>
                <p className="text-2xl font-bold">{analytics.overview.totalCourses}</p>
                <p className="text-xs text-green-600">
                  {analytics.overview.publishedCourses} منتشر شده
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">کل ثبتنامها</p>
                <p className="text-2xl font-bold">{analytics.overview.totalEnrollments.toLocaleString()}</p>
                <p className="text-xs text-blue-600">
                  {analytics.overview.completionRate}% تکمیل شده
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">درآمد کل</p>
                <p className="text-2xl font-bold">{analytics.overview.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-emerald-600">
                  {analytics.overview.premiumCourses} دوره پریمیوم
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">میانگین امتیاز</p>
                <p className="text-2xl font-bold">{analytics.overview.averageRating}</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= Math.floor(analytics.overview.averageRating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>توزیع دورهها بر اساس دستهبندی</CardTitle>
          <CardDescription>تعداد دورهها در هر دستهبندی</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.coursesByCategory.map((category) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{getCategoryLabel(category.category)}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {category.count} دوره
                  </span>
                </div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(category.count / analytics.overview.totalCourses) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {Math.round((category.count / analytics.overview.totalCourses) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Courses */}
      <Card>
        <CardHeader>
          <CardTitle>دورههای پرطرفدار</CardTitle>
          <CardDescription>دورههایی با بیشترین ثبتنام</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topPerformingCourses.map((course, index) => (
              <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium">{course.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {course.enrollments} ثبتنام
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        {course.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {course.price === 0 ? 'رایگان' : `${course.price.toLocaleString()} افغانی`}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant={course.price > 0 ? 'default' : 'secondary'}>
                  {course.price > 0 ? 'پریمیوم' : 'رایگان'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>فعالیتهای اخیر</CardTitle>
          <CardDescription>آخرین تغییرات در سیستم آموزش</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-2 border-l-2 border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">
                    {activity.action === 'COURSE_CREATED' && 'دوره جدید ایجاد شد'}
                    {activity.action === 'COURSE_ENROLLED' && 'ثبتنام جدید در دوره'}
                    {activity.action === 'COURSE_UPDATED' && 'دوره بروزرسانی شد'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleDateString('fa-IR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}