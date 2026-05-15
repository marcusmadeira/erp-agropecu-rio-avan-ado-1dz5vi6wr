import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRealtime } from '@/hooks/use-realtime'

export function AnimalReproducao({ animalId }: { animalId: string }) {
  const [nascimentos, setNascimentos] = useState<any[]>([])
  const [iatfs, setIatfs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [nData, iData] = await Promise.all([
        pb.collection('nascimentos_e_desmama').getFullList({
          filter: `matriz_mae_id="${animalId}"`,
          sort: '-data_nascimento',
        }),
        pb.collection('manejo_iatf_curral').getFullList({
          filter: `matriz_id="${animalId}"`,
          expand: 'touro_utilizado_id',
          sort: '-data_iatf',
        }),
      ])
      setNascimentos(nData)
      setIatfs(iData)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [animalId])

  useRealtime('nascimentos_e_desmama', loadData)
  useRealtime('manejo_iatf_curral', loadData)

  if (loading) {
    return <div className="text-center py-6">Carregando histórico reprodutivo...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-[#094016]">Histórico de Partos / Nascimentos</CardTitle>
        </CardHeader>
        <CardContent>
          {nascimentos.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum parto registrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data de Nascimento</TableHead>
                  <TableHead>Sexo</TableHead>
                  <TableHead>Peso ao Nascer (kg)</TableHead>
                  <TableHead>RGN / Brinco Bezerro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nascimentos.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>
                      {n.data_nascimento
                        ? format(new Date(n.data_nascimento.replace(' ', 'T')), 'dd/MM/yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>{n.sexo || '-'}</TableCell>
                    <TableCell>{n.peso_nascer || '-'}</TableCell>
                    <TableCell className="font-medium text-slate-700">
                      {n.rgn_provisorio_abcz || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#094016]">Protocolos IATF & DG</CardTitle>
        </CardHeader>
        <CardContent>
          {iatfs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum protocolo registrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data IATF</TableHead>
                  <TableHead>Touro Utilizado</TableHead>
                  <TableHead>Resultado DG</TableHead>
                  <TableHead>DPP (Previsão)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {iatfs.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      {i.data_iatf
                        ? format(new Date(i.data_iatf.replace(' ', 'T')), 'dd/MM/yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>{i.expand?.touro_utilizado_id?.id_manejo_brinco || '-'}</TableCell>
                    <TableCell>
                      {i.resultado_dg === 'Prenhe' ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-bold">
                          Prenhe
                        </span>
                      ) : i.resultado_dg === 'Vazia' ? (
                        <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-xs font-bold">
                          Vazia
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">
                          Pendente
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {i.data_provavel_parto_dpp
                        ? format(
                            new Date(i.data_provavel_parto_dpp.replace(' ', 'T')),
                            'dd/MM/yyyy',
                          )
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
