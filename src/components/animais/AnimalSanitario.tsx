import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Stethoscope } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export function AnimalSanitario({ pesagens }: { pesagens: any[] }) {
  const obs = pesagens.filter((p) => p.observacoes && p.observacoes.trim() !== '')
  const sorted = [...obs].sort(
    (a, b) => new Date(b.data_pesagem).getTime() - new Date(a.data_pesagem).getTime(),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-700">
          <Stethoscope className="w-4 h-4" /> Diário Clínico & Sanitário
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Nenhuma ocorrência sanitária ou observação registrada.
          </p>
        ) : (
          <div className="space-y-3">
            {sorted.map((p) => (
              <div key={p.id} className="text-sm border-l-2 border-rose-200 pl-3 py-1">
                <p className="font-medium text-slate-700">
                  {format(parseISO(p.data_pesagem), 'dd/MM/yyyy')} - Observação via Pesagem
                </p>
                <p className="text-slate-600 mt-1">{p.observacoes}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
