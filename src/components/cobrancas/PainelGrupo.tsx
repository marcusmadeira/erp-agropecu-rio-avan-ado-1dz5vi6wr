import { ParcelaCard } from '@/components/cobrancas/ParcelaCard'

interface Props {
  title: string
  colorClass: string
  parcelas: any[]
  itens: any[]
  historicos: any[]
  onRefresh: () => void
}

export function PainelGrupo({ title, colorClass, parcelas, itens, historicos, onRefresh }: Props) {
  if (parcelas.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${colorClass}`}>
          {parcelas.length}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {parcelas.map((p) => (
          <ParcelaCard
            key={p.id}
            parcela={p}
            itens={itens.filter((i) => i.venda_id === p.venda_id)}
            historicos={historicos.filter((h) => h.parcela_id === p.id)}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  )
}
