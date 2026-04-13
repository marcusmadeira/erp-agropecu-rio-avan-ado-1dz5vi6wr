import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export interface RowDataParceiro {
  nome_razao_social: string
  tipo_documento: string
  numero_documento: string
  contato_whatsapp_cobranca: string
  email_cobranca: string
  categoria_parceiro: string
  status_linha: 'Valid' | 'Warning' | 'Error'
  errors: string[]
  warnings: string[]
  status: string
  origem_importacao?: string
}

interface ImportPreviewTableProps {
  rows: RowDataParceiro[]
  limit?: number
}

export function ImportPreviewParceirosTable({ rows, limit = 5 }: ImportPreviewTableProps) {
  if (rows.length === 0) return null

  return (
    <div className="rounded-md border bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead>Nome/Razão Social</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Detalhes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, limit).map((row, idx) => (
            <TableRow key={idx} className={row.status_linha === 'Error' ? 'bg-rose-50/50' : ''}>
              <TableCell>
                {row.status_linha === 'Valid' && (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600">Válido</Badge>
                )}
                {row.status_linha === 'Warning' && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    Aviso
                  </Badge>
                )}
                {row.status_linha === 'Error' && <Badge variant="destructive">Erro</Badge>}
              </TableCell>
              <TableCell className="font-medium text-slate-900">
                {row.nome_razao_social || '-'}
              </TableCell>
              <TableCell className="text-slate-500">{row.numero_documento || '-'}</TableCell>
              <TableCell>{row.categoria_parceiro || '-'}</TableCell>
              <TableCell className="truncate max-w-[150px]">
                {row.email_cobranca || row.contato_whatsapp_cobranca || '-'}
              </TableCell>
              <TableCell>
                {row.errors.length > 0 && (
                  <span className="text-xs text-rose-600 block font-medium">
                    {row.errors.join(', ')}
                  </span>
                )}
                {row.warnings.length > 0 && (
                  <span className="text-xs text-amber-600 block font-medium">
                    {row.warnings.join(', ')}
                  </span>
                )}
                {row.errors.length === 0 && row.warnings.length === 0 && (
                  <span className="text-xs text-emerald-600 block font-medium">
                    Pronto para importar
                  </span>
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
