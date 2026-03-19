import useAppStore from '@/stores/useAppStore'
import KpiCards from '@/components/dashboard/KpiCards'
import DashboardCharts from '@/components/dashboard/DashboardCharts'
import MaternidadeAlerts from '@/components/dashboard/MaternidadeAlerts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const { state } = useAppStore()

  if (state.userRole === 3) {
    return (
      <div className="space-y-4 animate-fade-in p-4 sm:p-0">
        <h2 className="text-2xl font-bold text-emerald-900 mb-4 tracking-tight">
          Painel Operacional (Campo)
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-subtle">
            <CardHeader>
              <CardTitle>Acesso Rápido</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button
                asChild
                className="w-full bg-emerald-800 hover:bg-emerald-900 h-16 text-lg shadow-md rounded-xl"
              >
                <Link to="/pesagem">Curral Digital (Pesagem)</Link>
              </Button>
              <Button
                asChild
                className="w-full bg-emerald-800 hover:bg-emerald-900 h-16 text-lg shadow-md rounded-xl"
              >
                <Link to="/manejo">Manejo Diário (Trato)</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-10 animate-fade-in">
      <h2 className="text-2xl font-bold text-emerald-900 mb-4 tracking-tight">
        {state.userRole === 1 ? 'Dashboard Executivo (Gestão 360º)' : 'Painel de Gerência'}
      </h2>
      <KpiCards />
      <DashboardCharts />
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <div className="col-span-1 md:col-span-2">
          <MaternidadeAlerts />
        </div>
      </div>
    </div>
  )
}
