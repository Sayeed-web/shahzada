import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'overview'
    const format = searchParams.get('format') || 'pdf'

    if (!['pdf', 'csv', 'excel'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

    try {
      // Generate report data
      const reportData = await generateReportData(reportType)
      
      if (format === 'csv') {
        const csv = generateCSV(reportData, reportType)
        
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="report-${reportType}-${new Date().toISOString().split('T')[0]}.csv"`
          }
        })
      }
      
      if (format === 'pdf') {
        // For now, return a simple text-based report
        // In production, you would use a PDF library like puppeteer or jsPDF
        const pdfContent = generatePDFContent(reportData, reportType)
        
        return new NextResponse(pdfContent, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="report-${reportType}-${new Date().toISOString().split('T')[0]}.pdf"`
          }
        })
      }

      return NextResponse.json({ error: 'Format not implemented yet' }, { status: 501 })

    } catch (dbError) {
      console.error('Database error in report export:', dbError)
      return NextResponse.json(
        { error: 'Failed to generate report' },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('Report export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generateReportData(reportType: string) {
  switch (reportType) {
    case 'users':
      return await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true
        },
        orderBy: { createdAt: 'desc' }
      })
      
    case 'sarafs':
      return await prisma.saraf.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      
    case 'transactions':
      return await prisma.transaction.findMany({
        include: {
          saraf: {
            select: {
              businessName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 1000 // Limit for performance
      })
      
    default:
      // Overview report
      const [users, sarafs, transactions] = await Promise.all([
        prisma.user.count(),
        prisma.saraf.count(),
        prisma.transaction.count()
      ])
      
      return {
        summary: {
          totalUsers: users,
          totalSarafs: sarafs,
          totalTransactions: transactions,
          generatedAt: new Date().toISOString()
        }
      }
  }
}

function generateCSV(data: any, reportType: string): string {
  if (reportType === 'users' && Array.isArray(data)) {
    const headers = ['ID', 'Name', 'Email', 'Role', 'Active', 'Created At', 'Last Login']
    const rows = data.map(user => [
      user.id,
      user.name,
      user.email,
      user.role,
      user.isActive ? 'Yes' : 'No',
      new Date(user.createdAt).toLocaleDateString(),
      user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'
    ])
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }
  
  if (reportType === 'sarafs' && Array.isArray(data)) {
    const headers = ['ID', 'Business Name', 'Owner Name', 'Owner Email', 'Status', 'Premium', 'Created At']
    const rows = data.map(saraf => [
      saraf.id,
      saraf.businessName,
      saraf.user?.name || '',
      saraf.user?.email || '',
      saraf.status,
      saraf.isPremium ? 'Yes' : 'No',
      new Date(saraf.createdAt).toLocaleDateString()
    ])
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }
  
  if (reportType === 'transactions' && Array.isArray(data)) {
    const headers = ['ID', 'Reference Code', 'Type', 'Status', 'From Amount', 'To Amount', 'Saraf', 'Created At']
    const rows = data.map(tx => [
      tx.id,
      tx.referenceCode,
      tx.type,
      tx.status,
      tx.fromAmount,
      tx.toAmount,
      tx.saraf?.businessName || '',
      new Date(tx.createdAt).toLocaleDateString()
    ])
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }
  
  // Overview report
  return `System Overview Report
Generated: ${new Date().toLocaleDateString()}

Total Users: ${data.summary?.totalUsers || 0}
Total Sarafs: ${data.summary?.totalSarafs || 0}
Total Transactions: ${data.summary?.totalTransactions || 0}`
}

function generatePDFContent(data: any, reportType: string): string {
  // This is a placeholder - in production you would use a proper PDF library
  // For now, return plain text that browsers will download
  return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 100
>>
stream
BT
/F1 12 Tf
100 700 Td
(System Report - ${reportType}) Tj
0 -20 Td
(Generated: ${new Date().toLocaleDateString()}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
356
%%EOF`
}