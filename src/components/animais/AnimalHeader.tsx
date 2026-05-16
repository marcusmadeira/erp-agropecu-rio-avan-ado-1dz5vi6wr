import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Scale, Truck, Heart, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { differenceInMonths, differenceInYears } from 'date-fns'

export function AnimalHeader({
  animal,
  pesagens,
  onEdit,
}: {
  animal: any
  pesagens: any[]
  onEdit: () => void
}) {
  const navigate = useNavigate()

  const getAgeText = (birthDate: string) => {
    if (!birthDate) return 'N/A'
    const d = new Date(birthDate)
    const years = differenceInYears(new Date(), d)
    const months = differenceInMonths(new Date(), d) % 12
    return `${years}a ${months}m`
  }

  const sortedPesagens = [...pesagens].sort(
    (a, b) => new Date(b.data_pesagem).getTime() - new Date(a.data_pesagem).getTime(),
  )
  const lastPesagem = sortedPesagens.length > 0 ? sortedPesagens[0] : null

  let gmdText = '-'
  if (sortedPesagens.length > 1) {
    const p1 = sortedPesagens[0]
    const p2 = sortedPesagens[sortedPesagens.length - 1]
    const days =
      (new Date(p1.data_pesagem).getTime() - new Date(p2.data_pesagem).getTime()) /
      (1000 * 3600 * 24)
    if (days > 0) gmdText = ((p1.peso_kg - p2.peso_kg) / days).toFixed(2) + ' kg/d'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/animais">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#094016] flex items-center gap-3">
              {animal.nome || `Brinco ${animal.id_manejo_brinco}`}
              <Badge variant="secondary" className="bg-[#094016]/10 text-[#094016]">
                {animal.categoria}
              </Badge>
              <Badge variant="outline" className="border-slate-300">
                {animal.status}
              </Badge>
            </h2>
            <div className="text-muted-foreground mt-1 text-sm flex flex-wrap gap-x-4 gap-y-1">
              <span>
                Brinco:{' '}
                <strong className="text-slate-700">{animal.id_manejo_brinco || 'N/A'}</strong>
              </span>
              <span>
                Lote:{' '}
                <strong className="text-slate-700">
                  {animal.expand?.lote_atual_id?.nome_lote ||
                    animal.expand?.lote_atual?.nome_lote ||
                    'Nenhum'}
                </strong>
              </span>
              <span>
                Pasto:{' '}
                <strong className="text-slate-700">
                  {animal.expand?.piquete_atual_id?.nome ||
                    animal.expand?.piquete_atual?.nome ||
                    'Nenhum'}
                </strong>
              </span>
              <span>
                Sexo: <strong className="text-slate-700">{animal.sexo || 'N/A'}</strong>
              </span>
              <span>
                Idade:{' '}
                <strong className="text-slate-700">{getAgeText(animal.data_nascimento)}</strong>
              </span>
            </div>
            <div className="text-muted-foreground text-sm flex flex-wrap gap-x-4 mt-1">
              <span>
                Último Peso:{' '}
                <strong className="text-slate-700">
                  {lastPesagem ? `${lastPesagem.peso_kg} kg` : 'N/A'}
                </strong>
              </span>
              <span>
                GMD Global: <strong className="text-slate-700">{gmdText}</strong>
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onEdit} className="bg-[#094016] hover:bg-[#094016]/90 text-white">
            <Edit className="w-4 h-4 mr-2" /> Editar
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/pesagem')}
          className="text-blue-700 border-blue-200 hover:bg-blue-50"
        >
          <Scale className="w-4 h-4 mr-2" /> Pesar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/apartacao')}
          className="text-amber-700 border-amber-200 hover:bg-amber-50"
        >
          <Truck className="w-4 h-4 mr-2" /> Movimentar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/reproducao')}
          className="text-rose-700 border-rose-200 hover:bg-rose-50"
        >
          <Heart className="w-4 h-4 mr-2" /> Reprodutivo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="text-slate-700 border-slate-200 hover:bg-slate-50"
        >
          <FileText className="w-4 h-4 mr-2" /> Obs / Sanitário
        </Button>
      </div>
    </div>
  )
}
