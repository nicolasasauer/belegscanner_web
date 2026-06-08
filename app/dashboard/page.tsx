import { createClient } from '@/lib/supabase/server'
import { getUserStats } from '@/lib/services/stats'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { CategoryChart } from '@/components/dashboard/CategoryChart'
import { MonthlyChart } from '@/components/dashboard/MonthlyChart'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let stats = null
  if (user) {
    try {
      stats = await getUserStats()
    } catch {
      // Stats will render empty state
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Übersicht deiner Belege</p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyChart data={stats?.by_month ?? []} />
        <CategoryChart data={stats?.by_category ?? []} />
      </div>
    </div>
  )
}
