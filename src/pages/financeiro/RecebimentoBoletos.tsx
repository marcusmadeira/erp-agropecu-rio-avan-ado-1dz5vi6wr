import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getBoletosCompletos, getHistoricoCobrancas } from '@/services/financeiro_recebimentos'
import DashboardRecebimentos from './recebimentos/DashboardRecebimentos'
import BoletosPendentes from './recebimentos/BoletosPendentes'
import BoletosRecebidos from './recebimentos/BoletosRecebidos'
import BoletosAtrasados from './recebimentos/BoletosAtrasados'
import HistoricoCobrancas from './recebimentos/HistoricoCobrancas'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { exportToPDF, exportToExcel } from '@/lib/export'
import { format } from 'date-fns'

export default function RecebimentoBoletos() {
  const [boletos, setBoletos] = useState<any[]>([])
  const [historico, setHistorico] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const loadData = async () => {
    try {
      setLoading(true)
      setError(false)
      const [bolData, histData] = await Promise.all([
        getBoletosCompletos(),
        getHistoricoCobrancas(),
      ])
      setBoletos(bolData)
      setHistorico(histData)
    } catch (err) {
      setError(true)
      toast({
        title: 'Houve um problema ao carregar os dados. Por favor, tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('parcelas_venda', () => loadData())
  useRealtime('boletos', () => loadData())
  useRealtime('historico_cobrancas', () => loadData())

  const handleExportarPDF = () => {
    exportToPDF({
      title: 'Relatório de Recebimentos',
      userName: user?.name,
      data: boletos.map((b) => ({
        cliente:
          b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id?.nome_razao_social || 'N/D',
        boleto: b.numero_boleto,
        valor: b.valor_boleto,
        vencimento: b.data_vencimento ? format(new Date(b.data_vencimento), 'dd/MM/yyyy') : '',
        status: b.status_boleto,
      })),
      columns: [
        { header: 'Cliente', dataKey: 'cliente' },
        { header: 'Boleto', dataKey: 'boleto' },
        { header: 'Valor', dataKey: 'valor' },
        { header: 'Vencimento', dataKey: 'vencimento' },
        { header: 'Status', dataKey: 'status' },
      ],
    })
  }

  const handleExportarExcel = () => {
    exportToExcel({
      title: 'Recebimentos Bruto',
      userName: user?.name,
      data: boletos.map((b) => ({
        cliente:
          b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id?.nome_razao_social || 'N/D',
        boleto: b.numero_boleto,
        valor: b.valor_boleto,
        vencimento: b.data_vencimento ? format(new Date(b.data_vencimento), 'dd/MM/yyyy') : '',
        status: b.status_boleto,
      })),
      columns: [
        { header: 'Cliente', dataKey: 'cliente' },
        { header: 'Boleto', dataKey: 'boleto' },
        { header: 'Valor', dataKey: 'valor' },
        { header: 'Vencimento', dataKey: 'vencimento' },
        { header: 'Status', dataKey: 'status' },
      ],
    })
  }

  if (loading && boletos.length === 0)
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold text-red-600">Erro de Conexão</h2>
        <p className="text-muted-foreground">
          Houve um problema ao carregar os dados. Por favor, tente novamente.
        </p>
        <Button onClick={loadData}>Tentar Novamente</Button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#094016]">Controle de Recebimento</h1>
          <p className="text-muted-foreground">
            Gestão unificada de recebíveis, atrasos e cobranças.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportarExcel} disabled={boletos.length === 0}>
            <Download className="w-4 h-4 mr-2" /> Excel
          </Button>
          <Button variant="default" onClick={handleExportarPDF} disabled={boletos.length === 0}>
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      {boletos.length === 0 && historico.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <p className="text-muted-foreground text-lg font-medium">Nenhum dado disponível</p>
          <p className="text-sm text-slate-500 mt-2">
            Ainda não há boletos ou parcelas registradas para exibição.
          </p>
        </div>
      ) : (
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid grid-cols-5 w-full bg-slate-100">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
            <TabsTrigger value="recebidos">Recebidos</TabsTrigger>
            <TabsTrigger value="atrasados">Atrasados</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <DashboardRecebimentos boletos={boletos} />
          </TabsContent>
          <TabsContent value="pendentes">
            <BoletosPendentes boletos={boletos} onRefresh={loadData} />
          </TabsContent>
          <TabsContent value="recebidos">
            <BoletosRecebidos boletos={boletos} />
          </TabsContent>
          <TabsContent value="atrasados">
            <BoletosAtrasados boletos={boletos} onRefresh={loadData} />
          </TabsContent>
          <TabsContent value="historico">
            <HistoricoCobrancas historico={historico} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
