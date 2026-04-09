import { useState, useEffect, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  getPlanejamentos,
  deletePlanejamento,
  PlanejamentoAcasalamento,
} from '@/services/planejamento_acasalamento'
import { getIatfs, deleteIatf, ManejoIatf } from '@/services/manejo_iatf'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'

export default function EventosRepro() {
  const [planejamentos, setPlanejamentos] = useState<PlanejamentoAcasalamento[]>([])
  const [iatfs, setIatfs] = useState<ManejoIatf[]>([])
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    try {
      const [p, i] = await Promise.all([getPlanejamentos(), getIatfs()])
      setPlanejamentos(p)
      setIatfs(i)
    } catch (err) {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('planejamento_acasalamento', () => {
    loadData()
  })
  useRealtime('manejo_iatf_curral', () => {
    loadData()
  })

  const handleDeletePlan = async (id: string) => {
    if (confirm('Excluir planejamento?')) {
      try {
        await deletePlanejamento(id)
        toast({ title: 'Planejamento excluído' })
      } catch (e) {
        toast({ title: 'Erro ao excluir', variant: 'destructive' })
      }
    }
  }

  const handleDeleteIatf = async (id: string) => {
    if (confirm('Excluir IATF?')) {
      try {
        await deleteIatf(id)
        toast({ title: 'IATF excluída' })
      } catch (e) {
        toast({ title: 'Erro ao excluir', variant: 'destructive' })
      }
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Eventos Reprodutivos</h1>

      <Tabs defaultValue="planejamento">
        <TabsList>
          <TabsTrigger value="planejamento">Planejamento de Acasalamento</TabsTrigger>
          <TabsTrigger value="iatf">Manejos IATF</TabsTrigger>
        </TabsList>

        <TabsContent value="planejamento" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Planejamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matriz</TableHead>
                    <TableHead>Touro Opção 1</TableHead>
                    <TableHead>Touro Opção 2</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planejamentos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        Nenhum registro encontrado
                      </TableCell>
                    </TableRow>
                  )}
                  {planejamentos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.expand?.matriz_id?.id_manejo_brinco}</TableCell>
                      <TableCell>{p.expand?.touro_opcao_1_id?.id_manejo_brinco || '-'}</TableCell>
                      <TableCell>{p.expand?.touro_opcao_2_id?.id_manejo_brinco || '-'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePlan(p.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iatf" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Registros IATF</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matriz</TableHead>
                    <TableHead>Data IATF</TableHead>
                    <TableHead>Touro Utilizado</TableHead>
                    <TableHead>Resultado DG</TableHead>
                    <TableHead>DPP</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {iatfs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Nenhum registro encontrado
                      </TableCell>
                    </TableRow>
                  )}
                  {iatfs.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.expand?.matriz_id?.id_manejo_brinco}</TableCell>
                      <TableCell>{new Date(i.data_iatf).toLocaleDateString()}</TableCell>
                      <TableCell>{i.expand?.touro_utilizado_id?.id_manejo_brinco || '-'}</TableCell>
                      <TableCell>{i.resultado_dg || '-'}</TableCell>
                      <TableCell>
                        {i.data_provavel_parto_dpp
                          ? new Date(i.data_provavel_parto_dpp).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteIatf(i.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
