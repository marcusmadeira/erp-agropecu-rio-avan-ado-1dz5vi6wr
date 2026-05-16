import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dna, ShieldCheck } from 'lucide-react'

export function AnimalGenetica({ animal }: { animal: any }) {
  const isPO = animal.categoria?.includes('PO') || animal.rgd_rgn_abcz

  if (!isPO) {
    return (
      <Card className="bg-slate-50 border-slate-200 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-slate-500">
          <Dna className="w-8 h-8 mb-2 opacity-20" />
          <p className="text-sm font-medium">N/A - Animal Comercial</p>
          <p className="text-xs text-center max-w-[250px] mt-1">
            Dados genéticos detalhados (RGD/PO) não aplicáveis a esta categoria.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[#094016]/20 bg-[#094016]/[0.02]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#094016]">
          <ShieldCheck className="w-4 h-4" /> Genética & Registro PO
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500 font-medium">Registro ABCZ (RGD/RGN)</p>
            <p className="font-bold text-slate-800">{animal.rgd_rgn_abcz || 'Não informado'}</p>
          </div>
          <div>
            <p className="text-slate-500 font-medium">Categoria</p>
            <p className="font-bold text-slate-800">{animal.categoria || 'Não informado'}</p>
          </div>
          <div>
            <p className="text-slate-500 font-medium">Pai</p>
            <p className="font-bold text-slate-800">
              {animal.expand?.pai_id?.nome ||
                animal.expand?.pai_id?.id_manejo_brinco ||
                animal.genealogia_pai ||
                'Desconhecido'}
            </p>
          </div>
          <div>
            <p className="text-slate-500 font-medium">Mãe</p>
            <p className="font-bold text-slate-800">
              {animal.expand?.mae_id?.nome ||
                animal.expand?.mae_id?.id_manejo_brinco ||
                animal.genealogia_mae ||
                'Desconhecida'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
