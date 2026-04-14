import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import pb from '@/lib/pocketbase/client'

export default function EstoqueRebanho() {
  const [estoque, setEstoque] = useState<any[]>([])
  const [animais, setAnimais] = useState<any[]>([])

  useEffect(() => {
    pb.collection('animais').getFullList({ filter: 'status="Ativo"' }).then(setAnimais)
    pb.collection('estoque_peso_fazenda').getFullList({ sort: '-data_calculo' }).then(setEstoque)
  }, [])

  const totalCabecas = animais.length
  const totalPeso = animais.reduce((acc, a) => acc + (a.peso_atual_kg || 0), 0)
  const totalArrobas = totalPeso / 15
  const valorArroba = 250
  const totalValor = totalArrobas * valorArroba

  const formatCurr = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-[#094016]">Estoque e Valor do Rebanho</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-l-4 border-l-[#094016]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Cabeças</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{totalCabecas}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-[#094016]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Peso Total (kg)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{totalPeso.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-[#094016]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Arrobas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{totalArrobas.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-[#094016]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Valor Estimado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#094016]">{formatCurr(totalValor)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Histórico de Evolução</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cabeças</TableHead>
                <TableHead>Arrobas</TableHead>
                <TableHead>Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estoque.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{new Date(e.data_calculo).toLocaleDateString()}</TableCell>
                  <TableCell>{e.total_cabecas}</TableCell>
                  <TableCell>{e.total_arrobas?.toFixed(2)}</TableCell>
                  <TableCell>{formatCurr(e.valor_total_rebanho)}</TableCell>
                </TableRow>
              ))}
              {estoque.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                    Nenhum registro de histórico.
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
