import { useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format, parseISO } from 'date-fns'
import { CloudRain } from 'lucide-react'

export default function Clima() {
  const { state, dispatch } = useAppStore()
  const [val, setVal] = useState('')

  const handleAdd = () => {
    if (!val) return
    dispatch((s) => ({
      ...s,
      clima: [
        { id: Math.random().toString(), date: new Date().toISOString(), pluviometria: Number(val) },
        ...s.clima,
      ],
    }))
    setVal('')
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 justify-center mb-6">
        <CloudRain className="w-8 h-8 text-blue-500" />
        <h2 className="text-2xl font-bold text-emerald-900">Índice Pluviométrico</h2>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          type="number"
          placeholder="Pluviometria de Hoje (mm)"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <Button onClick={handleAdd} className="bg-emerald-800">
          Registrar Chuva
        </Button>
      </div>

      <Card className="shadow-subtle">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data do Registro</TableHead>
                <TableHead className="text-right">Volume (mm)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.clima.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{format(parseISO(c.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-blue-600">
                    {c.pluviometria} mm
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
