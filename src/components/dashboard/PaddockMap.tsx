import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import useAppStore from '@/stores/useAppStore'

export default function PaddockMap() {
  const { state } = useAppStore()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Livre':
        return 'bg-emerald-100 border-emerald-200 text-emerald-800'
      case 'Ocupado':
        return 'bg-amber-100 border-amber-200 text-amber-800'
      case 'Em Descanso':
        return 'bg-slate-100 border-slate-200 text-slate-800'
      default:
        return ''
    }
  }

  return (
    <Card className="shadow-subtle mt-4">
      <CardHeader>
        <CardTitle className="text-emerald-900">Mapa de Pastos e Piquetes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {state.pastos.map((pasto) => {
            const lote = state.lotes.find((l) => l.id === pasto.loteId)
            const numAnimals = lote ? state.animais.filter((a) => a.loteId === lote.id).length : 0
            return (
              <div
                key={pasto.id}
                className={`p-4 rounded-lg border transition-transform hover:-translate-y-1 hover:shadow-md ${getStatusColor(pasto.status)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-sm">{pasto.name}</h3>
                  <Badge variant="outline" className="bg-white/50">
                    {pasto.status}
                  </Badge>
                </div>
                <div className="text-xs space-y-1">
                  <p>
                    Altura: <span className="font-mono font-bold">{pasto.grassHeight} cm</span>
                  </p>
                  <p>Lote: {lote ? lote.name : 'Nenhum'}</p>
                  <p>
                    Cabeças:{' '}
                    <span className="font-mono font-bold">
                      {numAnimals} / {pasto.capacity}
                    </span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
