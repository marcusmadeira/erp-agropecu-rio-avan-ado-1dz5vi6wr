import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import { Activity, Truck, Scale, Heart, Baby, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AnimalTimeline({ animal, pesagens }: { animal: any; pesagens: any[] }) {
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const [apartacoes, iatfs, nascimentos, itensVenda] = await Promise.all([
          pb.collection('apartacao_dinamica').getFullList({
            filter: `animal_id='${animal.id}'`,
            expand: 'lote_anterior_id,lote_novo_id',
          }),
          animal.sexo === 'Fêmea'
            ? pb.collection('manejo_iatf_curral').getFullList({
                filter: `matriz_id='${animal.id}'`,
                expand: 'touro_utilizado_id',
              })
            : Promise.resolve([]),
          animal.sexo === 'Fêmea'
            ? pb.collection('nascimentos_e_desmama').getFullList({
                filter: `matriz_mae_id='${animal.id}'`,
              })
            : Promise.resolve([]),
          pb.collection('itens_venda').getFullList({
            filter: `animal_id='${animal.id}'`,
            expand: 'venda_id',
          }),
        ])

        const timeline: any[] = []

        if (animal.data_nascimento) {
          timeline.push({
            id: 'nasc',
            date: animal.data_nascimento,
            type: 'birth',
            title: 'Nascimento',
            desc: `Registrado no sistema`,
            icon: Baby,
            module: 'Cadastro',
          })
        } else {
          timeline.push({
            id: 'ent',
            date: animal.created,
            type: 'entry',
            title: 'Entrada no Sistema',
            desc: `Cadastro inicial`,
            icon: Activity,
            module: 'Cadastro',
          })
        }

        pesagens.forEach((p) => {
          timeline.push({
            id: p.id,
            date: p.data_pesagem,
            type: 'weight',
            title: 'Pesagem',
            desc: `${p.peso_kg} kg registrado. ${p.observacoes || ''}`,
            icon: Scale,
            module: 'Pesagem',
          })
        })

        apartacoes.forEach((a) => {
          timeline.push({
            id: a.id,
            date: a.data_apartacao || a.created,
            type: 'move',
            title: 'Movimentação (Apartação)',
            desc: `De ${a.expand?.lote_anterior_id?.nome_lote || 'N/A'} para ${a.expand?.lote_novo_id?.nome_lote || 'N/A'}. ${a.motivo || ''}`,
            icon: Truck,
            module: 'Manejo',
          })
        })

        iatfs.forEach((i) => {
          timeline.push({
            id: i.id,
            date: i.data_iatf,
            type: 'iatf',
            title: 'Protocolo IATF',
            desc: `Touro: ${i.expand?.touro_utilizado_id?.id_manejo_brinco || 'N/A'}. Res: ${i.resultado_dg || 'Pendente'}`,
            icon: Heart,
            module: 'Reprodução',
          })
        })

        nascimentos.forEach((n) => {
          timeline.push({
            id: n.id,
            date: n.data_nascimento,
            type: 'calving',
            title: 'Parto',
            desc: `Cria ${n.sexo || ''} (${n.peso_nascer || '-'}kg) ${n.rgn_provisorio_abcz ? `RGN: ${n.rgn_provisorio_abcz}` : ''}`,
            icon: Baby,
            module: 'Reprodução',
          })
        })

        itensVenda.forEach((v) => {
          const dataVenda = v.expand?.venda_id?.data_venda || v.created
          timeline.push({
            id: v.id,
            date: dataVenda,
            type: 'sale',
            title: 'Venda',
            desc: `Vendido. ${v.status_anterior ? `Status anterior: ${v.status_anterior}` : ''}`,
            icon: DollarSign,
            module: 'Comercial',
          })
        })

        timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setEvents(timeline)
      } catch (e) {
        console.error('Failed to load timeline events', e)
      }
    }
    loadEvents()
  }, [animal, pesagens])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linha do Tempo (Eventos)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((e, idx) => {
            const Icon = e.icon
            return (
              <div
                key={`${e.id}-${idx}`}
                className="flex gap-4 p-3 border rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="mt-1 p-2 bg-white border shadow-sm rounded-full h-fit">
                  <Icon className="w-4 h-4 text-[#094016]" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-slate-800 text-sm">{e.title}</h4>
                    <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded border">
                      {format(parseISO(e.date), 'dd/MM/yyyy')}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mt-1">{e.desc}</p>
                  <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider">
                    {e.module}
                  </p>
                </div>
              </div>
            )
          })}
          {events.length === 0 && (
            <p className="text-slate-500 text-center py-4 text-sm">Nenhum evento registrado.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
