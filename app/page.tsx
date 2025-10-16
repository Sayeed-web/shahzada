import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MarketOverview } from '@/components/dashboard/market-overview'
import { ExchangeRates } from '@/components/dashboard/exchange-rates'
import { CryptoSection } from '@/components/dashboard/crypto-section'
import { SarafDirectory } from '@/components/dashboard/saraf-directory'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { RealMarketData } from '@/components/dashboard/real-market-data'
import { UserChatWidget } from '@/components/chat/UserChatWidget'
import { ContentDisplay } from '@/components/dashboard/ContentDisplay'

export default function Home() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="text-center py-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-4">
            سرای شهزاده
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
            پلتفورم جامع مالی برای افغانستان
          </p>
          <QuickActions />
        </div>
        
        <div className="space-y-8">
          <RealMarketData />
          
          <ContentDisplay />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-6 lg:space-y-8">
              <MarketOverview />
              <ExchangeRates />
              <CryptoSection />
            </div>
            <div>
              <SarafDirectory />
            </div>
          </div>
        </div>
      </div>
      <UserChatWidget />
    </DashboardLayout>
  )
}