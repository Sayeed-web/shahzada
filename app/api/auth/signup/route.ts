import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const signupSchema = z.object({
  name: z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد'),
  email: z.string().email('ایمیل معتبر وارد کنید'),
  phone: z.string().optional(),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
  role: z.enum(['USER', 'SARAF']).default('USER')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = signupSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'کاربری با این ایمیل قبلاً ثبت نام کرده است' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        password: hashedPassword,
        role: validatedData.role
      }
    })

    // If user is SARAF, create saraf profile with PENDING status
    if (validatedData.role === 'SARAF') {
      await prisma.saraf.create({
        data: {
          userId: user.id,
          businessName: validatedData.name,
          businessAddress: '',
          businessPhone: validatedData.phone || '',
          status: 'PENDING'
        }
      })
    }

    return NextResponse.json({
      message: 'ثبت نام با موفقیت انجام شد',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Signup error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'خطا در ثبت نام' },
      { status: 500 }
    )
  }
}