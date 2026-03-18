import useAppStore from '@/stores/useAppStore'
import KpiCards from '@/components/dashboard/KpiCards'
import DashboardCharts from '@/components/dashboard/DashboardCharts'
import PaddockMap from '@/components/dashboard/PaddockMap'
import MaternidadeAlerts from '@/components/dashboard/MaternidadeAlerts'
import ManagerDashboard from '@/components/dashboard/ManagerDashboard'
import OperationDashboard from '@/components/dashboard/OperationDashboard'

export default function Dashboard() {
  const { state } = useAppStore()

  if (state.userRole === 2) {
    return <ManagerDashboard />
  }

  if (state.userRole === 3) {
    return <OperationDashboard />
  }

  // Admin/CEO (Role 1) - Management/Technical Focus
  return (
    <div className="space-y-4 pb-10 animate-fade-in">
      <h2 className="text-2xl font-bold text-emerald-900 mb-4 tracking-tight">
        Dashboard Executivo (Gestão Técnica)
      </h2>
      <KpiCards />
      <DashboardCharts />
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <div className="col-span-1 md:col-span-2">
          <PaddockMap />
        </div>
        <div className="col-span-1 md:col-span-2">
          <MaternidadeAlerts />
        </div>
      </div>
    </div>
  )
}
