import KpiCards from '@/components/dashboard/KpiCards'
import DashboardCharts from '@/components/dashboard/DashboardCharts'
import PaddockMap from '@/components/dashboard/PaddockMap'
import MaternidadeAlerts from '@/components/dashboard/MaternidadeAlerts'

export default function Dashboard() {
  return (
    <div className="space-y-2 pb-10">
      <h2 className="text-2xl font-bold text-emerald-900 mb-4 tracking-tight">
        Dashboard Executivo
      </h2>
      <KpiCards />
      <DashboardCharts />
      <PaddockMap />
      <MaternidadeAlerts />
    </div>
  )
}
