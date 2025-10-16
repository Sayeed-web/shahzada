import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      name,
      email,
      phone,
      password,
      businessName,
      businessAddress,
      businessPhone,
      businessCity,
      licenseNumber
    } = body

    if (!name || !email || !password || !businessName || !businessAddress) {
      return NextResponse.json(
        { error: 'تمام فیلدهای الزامی را پر کنید' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'کاربری با این ایمیل قبلاً ثبت نام کرده است' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: 'SARAF',
        isActive: true,
        isVerified: false
      }
    })

    const saraf = await prisma.saraf.create({
      data: {
        userId: user.id,
        businessName,
        businessAddress,
        businessPhone: businessPhone || phone,
        licenseNumber,
        status: 'PENDING',
        isActive: false,
        isPremium: false,
        rating: 0,
        totalTransactions: 0
      }
    })

    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    })

    for (const admin of adminUsers) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'درخواست عضویت صراف جدید',
          message: `${businessName} درخواست عضویت در سیستم داده است`,
          type: 'info',
          action: 'NEW_SARAF_REQUEST',
          resource: 'SARAF',
          resourceId: saraf.id
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'ثبت نام با موفقیت انجام شد. درخواست شما در انتظار بررسی است.'
    })

  } catch (error) {
    console.error('Saraf signup error:', error)
    return NextResponse.json(
      { error: 'خطا در ثبت نام' },
      { status: 500 }
    )
  }
}