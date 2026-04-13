import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export interface RowData {
  id_manejo_brinco: string
  rgd_rgn_abcz: string
  categoria: string
  status_animal: string
  peso_atual_kg: number
  genealogia_pai: string
  genealogia_mae: string
  custo_variavel_acumulado: number
  lote_atual_id: string | null
  nome_lote: string
  status: 'Valid' | 'Warning' | 'Error'
  errors: string[]
  warnings: string[]
}

interface ImportPreviewTableProps {
  rows: RowData[]
  limit?: number
}

export function ImportPreviewTable({ rows, limit = 5 }: ImportPreviewTableProps) {
  if (rows.length === 0) return null

  return (
    <div className="rounded-md border bg-white overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead>Brinco</TableHead>
            <TableHead>RGD</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Peso (kg)</TableHead>
            <TableHead>Lote</TableHead>
            <TableHead>Detalhes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, limit).map((row, idx) => (
            <TableRow key={idx} className={row.status === 'Error' ? 'bg-rose-50/50' : ''}>
              <TableCell>
                {row.status === 'Valid' && (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600">Válido</Badge>
                )}
                {row.status === 'Warning' && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    Aviso
                  </Badge>
                )}
                {row.status === 'Error' && <Badge variant="destructive">Erro</Badge>}
              </TableCell>
              <TableCell className="font-medium text-slate-900">
                {row.id_manejo_brinco || '-'}
              </TableCell>
              <TableCell className="text-slate-500">{row.rgd_rgn_abcz || '-'}</TableCell>
              <TableCell>{row.categoria || '-'}</TableCell>
              <TableCell>{row.peso_atual_kg}</TableCell>
              <TableCell className="truncate max-w-[120px]">{row.nome_lote || '-'}</TableCell>
              <TableCell>
                {row.errors.length > 0 && (
                  <span className="text-xs text-rose-600 block">{row.errors.join(', ')}</span>
                )}
                {row.warnings.length > 0 && (
                  <span className="text-xs text-amber-600 block">{row.warnings.join(', ')}</span>
                )}
                {row.errors.length === 0 && row.warnings.length === 0 && (
                  <span className="text-xs text-emerald-600 block">Pronto para importar</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length > limit && (
        <div className="p-3 text-center text-sm text-slate-500 border-t bg-slate-50">
          Mostrando {limit} de {rows.length} registros.
        </div>
      )}
    </div>
  )
}
