import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'

export default function Inventario() {
  const { toast } = useToast()
  const [inventarios, setInventarios] = useState<any[]>([])

  const load = () => {
    pb.collection('inventario_pecuario_geral')
      .getFullList({ sort: '-data_inventario' })
      .then(setInventarios)
  }

  useEffect(() => {
    load()
  }, [])

  const handleNew = async () => {
    try {
      const animais = await pb.collection('animais').getFullList({ filter: 'status="Ativo"' })
      await pb.collection('inventario_pecuario_geral').create({
        data_inventario: new Date().toISOString(),
        total_cabecas: animais.length,
        status: 'Em Andamento',
      })
      toast({ title: 'Inventário iniciado' })
      load()
    } catch {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-[#094016]">Inventário Pecuário Geral</h1>
        <Button onClick={handleNew} className="bg-[#094016] hover:bg-[#094016]/90 text-white">
          Iniciar Inventário
        </Button>
      </div>
      <Card className="shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Total Cabeças</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventarios.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">
                    {format(new Date(inv.data_inventario), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>{inv.total_cabecas}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-[#094016]">
                      {inv.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {inventarios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                    Nenhum inventário realizado.
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
