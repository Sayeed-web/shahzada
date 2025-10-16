import { NextRequest, NextResponse } from 'next/server'

const fallbackCourses = [
  {
    id: '1',
    title: 'آموزش کامل ارزهای دیجیتال برای مبتدیان',
    description: 'در این دوره جامع با مفاهیم پایه ارزهای دیجیتال، بیت کوین، اتریوم و نحوه خرید و فروش آشنا میشوید',
    category: 'crypto',
    level: 'beginner',
    duration: 45,
    price: 0,
    isPremium: false,
    videoUrl: 'https://youtu.be/N920p250fmU',
    tags: ['کریپتو', 'بیت کوین', 'آموزش', 'مبتدی'],
    rating: 4.5,
    enrollments: 1250,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'تحلیل تکنیکال در بازار ارز',
    description: 'آموزش کامل تحلیل تکنیکال، شناخت الگوها، اندیکاتورها و استراتژیهای معاملاتی',
    category: 'trading',
    level: 'intermediate',
    duration: 60,
    price: 0,
    isPremium: false,
    videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
    tags: ['تحلیل تکنیکال', 'معاملات', 'فارکس'],
    rating: 4.7,
    enrollments: 980,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'مدیریت ریسک در سرمایهگذاری',
    description: 'یادگیری اصول مدیریت ریسک، تنوعبخشی سبد سرمایه و حفظ سرمایه در بازارهای مالی',
    category: 'finance',
    level: 'intermediate',
    duration: 40,
    price: 0,
    isPremium: false,
    videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
    tags: ['مدیریت ریسک', 'سرمایهگذاری', 'مالی'],
    rating: 4.6,
    enrollments: 750,
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    title: 'آموزش بلاکچین و فناوریهای نوین',
    description: 'شناخت فناوری بلاکچین، قراردادهای هوشمند و کاربردهای آن در دنیای واقعی',
    category: 'crypto',
    level: 'advanced',
    duration: 55,
    price: 0,
    isPremium: true,
    videoUrl: 'https://youtu.be/SSo_EIwHSd4',
    tags: ['بلاکچین', 'فناوری', 'پیشرفته'],
    rating: 4.8,
    enrollments: 620,
    createdAt: new Date().toISOString()
  },
  {
    id: '5',
    title: 'استراتژیهای معاملاتی در فارکس',
    description: 'آموزش استراتژیهای کاربردی معاملاتی، مدیریت سرمایه و روانشناسی معاملهگری',
    category: 'trading',
    level: 'advanced',
    duration: 70,
    price: 0,
    isPremium: true,
    videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
    tags: ['فارکس', 'استراتژی', 'معاملات'],
    rating: 4.9,
    enrollments: 890,
    createdAt: new Date().toISOString()
  },
  {
    id: '6',
    title: 'آموزش سرمایهگذاری در طلا و نقره',
    description: 'راهنمای کامل سرمایهگذاری در فلزات گرانبها، تحلیل بازار طلا و استراتژیهای خرید',
    category: 'finance',
    level: 'beginner',
    duration: 35,
    price: 0,
    isPremium: false,
    videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
    tags: ['طلا', 'نقره', 'سرمایهگذاری'],
    rating: 4.4,
    enrollments: 1100,
    createdAt: new Date().toISOString()
  },
  {
    id: '7',
    title: 'اقتصاد کلان برای سرمایهگذاران',
    description: 'درک مفاهیم اقتصاد کلان، تورم، نرخ بهره و تاثیر آنها بر بازارهای مالی',
    category: 'finance',
    level: 'intermediate',
    duration: 50,
    price: 0,
    isPremium: false,
    videoUrl: 'https://youtu.be/PHe0bXAIuk0',
    tags: ['اقتصاد', 'تورم', 'مالی'],
    rating: 4.5,
    enrollments: 670,
    createdAt: new Date().toISOString()
  },
  {
    id: '8',
    title: 'امنیت در معاملات ارز دیجیتال',
    description: 'آموزش نحوه محافظت از داراییهای دیجیتال، کیف پولهای امن و جلوگیری از کلاهبرداری',
    category: 'crypto',
    level: 'beginner',
    duration: 30,
    price: 0,
    isPremium: false,
    videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
    tags: ['امنیت', 'کریپتو', 'کیف پول'],
    rating: 4.7,
    enrollments: 1450,
    createdAt: new Date().toISOString()
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const level = searchParams.get('level')
    
    let filteredCourses = [...fallbackCourses]
    
    if (category && category !== 'all') {
      filteredCourses = filteredCourses.filter(c => c.category === category)
    }
    
    if (level && level !== 'all') {
      filteredCourses = filteredCourses.filter(c => c.level === level)
    }
    
    return NextResponse.json(filteredCourses)
  } catch (error) {
    console.error('Courses fetch error:', error)
    return NextResponse.json(fallbackCourses)
  }
}