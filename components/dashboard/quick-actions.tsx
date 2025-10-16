'use client'

import { Button } from '@/components/ui/button'
import { Search, Calculator, Building, BookOpen, Smartphone, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export function QuickActions() {
  const { data: session } = useSession()

  const actions = [
    {
      title: 'پیگیری حواله',
      description: 'پیگیری وضعیت حواله با کد رهگیری',
      icon: Search,
      href: '/hawala/track',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'ماشین حساب ارز',
      description: 'تبدیل ارز و محاسبه نرخ‌ها',
      icon: Calculator,
      href: '/calculator',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'صرافان',
      description: 'مشاهده صرافان معتبر و نرخ‌ها',
      icon: Building,
      href: '/sarafs',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'آموزش',
      description: 'راهنمای استفاده و مفاهیم مالی',
      icon: BookOpen,
      href: '/education',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'اپلیکیشن موبایل',
      description: 'دانلود اپ موبایل سرای شهزاده',
      icon: Smartphone,
      href: '/mobile-app',
      color: 'bg-pink-500 hover:bg-pink-600'
    },
    {
      title: 'نمودارها',
      description: 'مشاهده روند قیمت‌ها و تحلیل بازار',
      icon: TrendingUp,
      href: '/charts',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {actions.map((action) => (
        <Button
          key={action.href}
          variant="ghost"
          className="h-auto p-4 flex-col gap-2 text-center hover:scale-105 transition-all duration-200"
          asChild
        >
          <Link href={action.href}>
            <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center text-white mb-2`}>
              <action.icon className="h-6 w-6" />
            </div>
            <div>
              <div className="font-medium text-sm">{action.title}</div>
              <div className="text-xs text-muted-foreground hidden md:block">
                {action.description}
              </div>
            </div>
          </Link>
        </Button>
      ))}
    </div>
  )
}