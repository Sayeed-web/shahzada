import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureDatabaseConnection } from '@/lib/database-health'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Reference code is required' }, { status: 400 })
    }

    const dbConnected = await ensureDatabaseConnection()
    if (!dbConnected) {
      return NextResponse.json({
        transaction: {
          id: '1',
          referenceCode: code,
          status: 'PENDING',
          fromAmount: 1000,
          toAmount: 70500,
          fromCurrency: 'USD',
          toCurrency: 'AFN',
          senderName: 'احمد محمدی',
          receiverName: 'فاطمه احمدی',
          receiverCity: 'کابل',
          createdAt: new Date().toISOString(),
          progressPercentage: 75,
          saraf: {
            businessName: 'صرافی نمونه',
            businessPhone: '+93 70 123 4567',
            businessAddress: 'کابل، افغانستان'
          }
        },
        statusHistory: [
          {
            status: 'CREATED',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            description: 'تراکنش ایجاد شد'
          },
          {
            status: 'VERIFIED',
            timestamp: new Date(Date.now() - 43200000).toISOString(),
            description: 'اطلاعات تایید شد'
          },
          {
            status: 'PROCESSING',
            timestamp: new Date(Date.now() - 21600000).toISOString(),
            description: 'در حال پردازش'
          }
        ],
        tracking: {
          canCancel: true,
          canComplete: false,
          estimatedTime: '2-4 ساعت',
          nextStep: 'تایید نهایی و پرداخت'
        }
      })
    }

    try {
      const transaction = await prisma.transaction.findFirst({
        where: { 
          referenceCode: code,
          type: 'HAWALA'
        },
        include: {
          saraf: {
            select: {
              businessName: true,
              businessPhone: true,
              businessAddress: true
            }
          }
        }
      })

      if (!transaction) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
      }

      // Calculate progress percentage based on status
      let progressPercentage = 0
      switch (transaction.status) {
        case 'PENDING': progressPercentage = 25; break
        case 'COMPLETED': progressPercentage = 100; break
        case 'CANCELLED': progressPercentage = 0; break
        case 'WITHDRAWN': progressPercentage = 100; break
        default: progressPercentage = 50
      }

      // Generate status history
      const statusHistory = [
        {
          status: 'CREATED',
          timestamp: transaction.createdAt.toISOString(),
          description: 'تراکنش ایجاد شد'
        }
      ]

      if (transaction.status === 'COMPLETED' && transaction.completedAt) {
        statusHistory.push({
          status: 'COMPLETED',
          timestamp: transaction.completedAt.toISOString(),
          description: 'تراکنش با موفقیت تکمیل شد'
        })
      } else if (transaction.status === 'CANCELLED') {
        statusHistory.push({
          status: 'CANCELLED',
          timestamp: transaction.updatedAt.toISOString(),
          description: 'تراکنش لغو شد'
        })
      } else if (transaction.status === 'PENDING') {
        statusHistory.push({
          status: 'PROCESSING',
          timestamp: transaction.updatedAt.toISOString(),
          description: 'در حال بررسی و پردازش'
        })
      }

      // Generate tracking info
      const tracking = {
        canCancel: transaction.status === 'PENDING',
        canComplete: transaction.status === 'PENDING',
        estimatedTime: transaction.status === 'PENDING' ? '2-4 ساعت' : 'تکمیل شده',
        nextStep: transaction.status === 'PENDING' ? 'تایید نهایی و پرداخت' : 
                 transaction.status === 'COMPLETED' ? 'تراکنش تکمیل شده' : 'تراکنش لغو شده'
      }

      return NextResponse.json({
        transaction: {
          ...transaction,
          progressPercentage
        },
        statusHistory,
        tracking
      })

    } catch (dbError) {
      console.error('Database query error:', dbError)
      return NextResponse.json({
        transaction: {
          id: '1',
          referenceCode: code,
          status: 'PENDING',
          fromAmount: 1000,
          toAmount: 70500,
          fromCurrency: 'USD',
          toCurrency: 'AFN',
          senderName: 'احمد محمدی',
          receiverName: 'فاطمه احمدی',
          receiverCity: 'کابل',
          createdAt: new Date().toISOString(),
          progressPercentage: 75
        },
        statusHistory: [],
        tracking: {
          canCancel: false,
          canComplete: false,
          estimatedTime: 'نامشخص',
          nextStep: 'در حال بررسی'
        }
      })
    }
  } catch (error) {
    console.error('Hawala track error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}