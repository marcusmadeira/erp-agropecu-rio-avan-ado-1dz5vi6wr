import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

export interface RowData {
  nome: string
  brinco: string
  rgd: string
  categoria: string
  data_nascimento: string
  peso: number
  lote: string
  status: 'Valid' | 'Warning' | 'Error'
  errors: string[]
  warnings: string[]
}

interface ImportPreviewTableProps {
  rows: RowData[]
}

export function ImportPreviewTable({ rows }: ImportPreviewTableProps) {
  if (!rows || rows.length === 0) return null

  return (
    <div className="border rounded-md mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Brinco</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Lote</TableHead>
            <TableHead>Peso</TableHead>
            <TableHead>Detalhes ADAPT</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 10).map((row, idx) => (
            <TableRow key={idx}>
              <TableCell>
                {row.status === 'Valid' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                {row.status === 'Warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                {row.status === 'Error' && <XCircle className="w-5 h-5 text-rose-500" />}
              </TableCell>
              <TableCell className="font-semibold">{row.brinco}</TableCell>
              <TableCell>{row.nome}</TableCell>
              <TableCell>{row.categoria}</TableCell>
              <TableCell>{row.lote}</TableCell>
              <TableCell>{row.peso} kg</TableCell>
              <TableCell className="max-w-[250px]">
                {row.errors.map((e, i) => (
                  <Badge key={i} variant="destructive" className="mr-1 mb-1 text-[10px]">
                    {e}
                  </Badge>
                ))}
                {row.warnings.map((w, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="mr-1 mb-1 text-[10px] border-amber-500 text-amber-700 bg-amber-50"
                  >
                    {w}
                  </Badge>
                ))}
                {row.status === 'Valid' && (
                  <span className="text-xs text-slate-500">Tudo certo</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length > 10 && (
        <div className="text-center py-2 text-xs text-slate-500 border-t">
          Mostrando 10 de {rows.length} registros...
        </div>
      )}
    </div>
  )
}
