import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'سرای شهزاده - پلتفورم جامع مالی افغانستان',
  description: 'سیستم جامع مالی برای صرافان، حواله داران و کاربران افغانستان',
  keywords: 'صرافی، حواله، افغانستان، ارز، طلا، نقره',
  authors: [{ name: 'Saray Shahzada Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'سرای شهزاده - پلتفورم جامع مالی افغانستان',
    description: 'سیستم جامع مالی برای صرافان، حواله داران و کاربران افغانستان',
    type: 'website',
    locale: 'fa_AF',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className="prevent-overflow">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={`${inter.className} prevent-overflow`} suppressHydrationWarning>
        <ErrorBoundary>
          <Providers>
            {children}
            <Toaster />
            <Sonner />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}