import { useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'

export default function Animais() {
  const { state } = useAppStore()
  const [search, setSearch] = useState('')

  const filtered = state.animais.filter(
    (a) => a.brinco.includes(search) || (a.rgn && a.rgn.includes(search)),
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-emerald-900">Cadastro de Animais</h2>
        <div className="flex items-center space-x-2 relative w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
          <Input
            className="pl-9 w-full sm:w-64"
            placeholder="Buscar Brinco / RGN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button className="bg-emerald-800 hidden sm:inline-flex">Novo Animal</Button>
        </div>
      </div>

      <Card className="shadow-subtle">
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brinco</TableHead>
                <TableHead>RGN</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>C. Custo</TableHead>
                <TableHead className="text-right">Peso Atual</TableHead>
                <TableHead className="text-right">GMD</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-bold">{a.brinco}</TableCell>
                  <TableCell>{a.rgn || '-'}</TableCell>
                  <TableCell>{state.lotes.find((l) => l.id === a.loteId)?.name || '-'}</TableCell>
                  <TableCell>{a.categoria}</TableCell>
                  <TableCell>
                    <Badge
                      variant={a.costCenter === 'CC01-PO' ? 'default' : 'secondary'}
                      className="text-[10px]"
                    >
                      {a.costCenter}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-900">
                    {a.pesoAtual} kg
                  </TableCell>
                  <TableCell className="text-right font-mono">{a.gmd.toFixed(3)}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    Nenhum animal encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
