import useAppStore from '@/stores/useAppStore'
import PaddockMap from '@/components/dashboard/PaddockMap'
import MaternidadeAlerts from '@/components/dashboard/MaternidadeAlerts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, Droplet, Scale, Tractor, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'

export default function OperationDashboard() {
  const { state } = useAppStore()

  const recentManejos = [...state.manejos]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4)

  return (
    <div className="space-y-4 pb-10 animate-fade-in">
      <h2 className="text-2xl font-bold text-emerald-900 mb-4 tracking-tight">
        Painel Operacional e Manejo
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Button
          asChild
          variant="outline"
          className="h-24 flex flex-col gap-2 shadow-sm hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
        >
          <Link to="/pesagem">
            <Scale className="w-8 h-8" />
            <span>Curral Digital</span>
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-24 flex flex-col gap-2 shadow-sm hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
        >
          <Link to="/manejo">
            <Droplet className="w-8 h-8" />
            <span>Trato Diário</span>
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-24 flex flex-col gap-2 shadow-sm hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
        >
          <Link to="/nascimentos">
            <ClipboardList className="w-8 h-8" />
            <span>Nascimentos</span>
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-24 flex flex-col gap-2 shadow-sm hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
        >
          <Link to="/maquinario">
            <Tractor className="w-8 h-8" />
            <span>Maquinário</span>
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <MaternidadeAlerts />

        <Card className="shadow-subtle mt-4 md:mt-0">
          <CardHeader>
            <CardTitle className="text-emerald-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Últimos Apontamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentManejos.length > 0 ? (
              <div className="space-y-4">
                {recentManejos.map((m) => {
                  const lote = state.lotes.find((l) => l.id === m.loteId)
                  return (
                    <div
                      key={m.id}
                      className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{m.type}</p>
                        <p className="text-xs text-muted-foreground">{lote?.name || 'Geral'}</p>
                      </div>
                      <div className="text-right text-xs text-slate-500 font-mono">
                        {format(parseISO(m.date), 'dd/MM HH:mm')}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum manejo recente.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <PaddockMap />
    </div>
  )
}
