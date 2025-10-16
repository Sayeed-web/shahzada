'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { SocialContentManager } from '@/components/social/SocialContentManager'

export default function AdminSocialContentPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <SocialContentManager />
      </div>
    </DashboardLayout>
  )
}