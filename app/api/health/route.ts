import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    // Security checks
    const securityIssues = []
    
    if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
      securityIssues.push('NEXTAUTH_SECRET too weak')
    }
    
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL?.includes('sslmode=require')) {
      securityIssues.push('Database SSL not enforced')
    }
    
    // Quick database connection check
    await prisma.$queryRaw`SELECT 1`
    
    // Check if users exist, if not create them
    const userCount = await prisma.user.count()
    
    if (userCount === 0) {
      // Create default users
      const users = [
        {
          email: 'admin@saray.af',
          password: await bcrypt.hash('Admin@123456', 12),
          name: 'System Administrator',
          role: 'ADMIN',
          isActive: true,
          isVerified: true
        },
        {
          email: 'saraf@test.af',
          password: await bcrypt.hash('Saraf@123456', 12),
          name: 'Test Saraf',
          role: 'SARAF',
          isActive: true,
          isVerified: true
        },
        {
          email: 'user@test.af',
          password: await bcrypt.hash('User@123456', 12),
          name: 'Test User',
          role: 'USER',
          isActive: true,
          isVerified: true
        }
      ]
      
      for (const userData of users) {
        await prisma.user.create({ data: userData })
      }
    }
    
    const finalUserCount = await prisma.user.count()
    
    return NextResponse.json({
      status: securityIssues.length > 0 ? 'warning' : 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      users: finalUserCount,
      seeded: userCount === 0 ? 'yes' : 'already',
      security: {
        issues: securityIssues,
        score: securityIssues.length === 0 ? 'good' : 'needs_attention'
      }
    })
    
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        database: 'disconnected',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}