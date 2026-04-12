import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ImportPreviewTableProps {
  csvRows: any[]
  mapping: Record<string, string>
  systemFields: { key: string; label: string }[]
  limit?: number
}

export function ImportPreviewTable({
  csvRows,
  mapping,
  systemFields,
  limit = 5,
}: ImportPreviewTableProps) {
  const visibleFields = systemFields.filter((f) => mapping[f.key])

  if (visibleFields.length === 0 || csvRows.length === 0) {
    return null
  }

  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50 border-b pb-3">
        <CardTitle className="text-sm">Pré-visualização de Dados (Mapeados)</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleFields.map((f) => (
                <TableHead key={f.key} className="text-xs whitespace-nowrap">
                  {f.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {csvRows.slice(0, limit).map((row, idx) => (
              <TableRow key={idx}>
                {visibleFields.map((f) => (
                  <TableCell key={f.key} className="text-xs truncate max-w-[150px]">
                    {row[mapping[f.key]] || '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
