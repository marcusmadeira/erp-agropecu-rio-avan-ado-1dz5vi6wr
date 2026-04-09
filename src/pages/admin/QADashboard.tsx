import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ShieldCheck,
  Server,
  Database,
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Laptop,
  Tablet,
  History,
  FileCode2,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getOfflineQueue } from '@/lib/offline-sync'
import { cn } from '@/lib/utils'

type CheckResult = {
  name: string
  status: 'pending' | 'success' | 'error'
  message?: string
}

type LogEntry = {
  id: string
  timestamp: Date
  module: string
  testType: string
  result: 'success' | 'error'
  message: string
}

const initialChecks: CheckResult[] = [
  { name: 'PocketBase Connection', status: 'pending' },
  { name: 'parceiros_negocios', status: 'pending' },
  { name: 'lotes', status: 'pending' },
  { name: 'animais', status: 'pending' },
  { name: 'estoque_insumos', status: 'pending' },
  { name: 'transacoes_financeiras', status: 'pending' },
  { name: 'manejo_iatf_curral', status: 'pending' },
  { name: 'pesagens_diarias', status: 'pending' },
]

export default function QADashboard() {
  const [isChecking, setIsChecking] = useState(false)
  const [checks, setChecks] = useState<CheckResult[]>(initialChecks)
  const [iframeWidth, setIframeWidth] = useState('100%')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [pwaStatus, setPwaStatus] = useState({
    online: navigator.onLine,
    sw: false,
    queueCount: 0,
    manifest: false,
  })

  const checkPWA = () => {
    setPwaStatus({
      online: navigator.onLine,
      sw: !!navigator.serviceWorker?.controller,
      queueCount: getOfflineQueue().length,
      manifest: !!document.querySelector('link[rel="manifest"]'),
    })
  }

  const addLog = (
    module: string,
    testType: string,
    result: 'success' | 'error',
    message: string,
  ) => {
    setLogs((prev) => {
      const newLog = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        module,
        testType,
        result,
        message,
      }
      return [newLog, ...prev].slice(0, 20)
    })
  }

  const runChecks = async () => {
    if (isChecking) return
    setIsChecking(true)
    setChecks(initialChecks)

    const updateStatus = (name: string, status: 'success' | 'error', message: string) => {
      setChecks((prev) => prev.map((c) => (c.name === name ? { ...c, status, message } : c)))
    }

    // 1. Backend connection test
    try {
      await pb.health.check()
      updateStatus('PocketBase Connection', 'success', 'Conectado com sucesso ao Skip Cloud')
      addLog('Sistema', 'Health Check', 'success', 'Conexão com Skip Cloud estabelecida')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha na conexão'
      updateStatus('PocketBase Connection', 'error', msg)
      addLog('Sistema', 'Health Check', 'error', msg)
    }

    // 2. Collections CRUD schema access validation
    const collections = [
      {
        name: 'parceiros_negocios',
        mock: () => ({ nome_razao_social: 'QA_TEST_PARCEIRO', tipo_documento: 'CPF' }),
      },
      {
        name: 'lotes',
        mock: () => ({ nome_lote: 'QA_TEST_LOTE', centro_custo: 'CC01-Nelore PO' }),
      },
      {
        name: 'animais',
        mock: () => ({ id_manejo_brinco: 'QA_TEST_BRINCO', categoria: 'Bezerro' }),
      },
      {
        name: 'estoque_insumos',
        mock: () => ({ produto: 'QA_TEST_PRODUTO', quantidade_atual: 10, unidade_medida: 'KG' }),
      },
    ]

    for (const col of collections) {
      try {
        await pb.collection(col.name).getList(1, 1)
        const mockData = col.mock()
        const created = await pb.collection(col.name).create(mockData)
        await pb.collection(col.name).update(created.id, mockData)
        await pb.collection(col.name).delete(created.id)

        updateStatus(col.name, 'success', 'Ciclo CRUD completo com sucesso')
        addLog(
          col.name,
          'CRUD Completo',
          'success',
          'Read, Create, Update, Delete testados com sucesso',
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro no ciclo CRUD'
        updateStatus(col.name, 'error', msg)
        addLog(col.name, 'CRUD Completo', 'error', msg)
      }
    }

    // Dependent collections
    const depCollections = [
      {
        name: 'transacoes_financeiras',
        mock: async () => {
          let parceiro = await pb
            .collection('parceiros_negocios')
            .getFirstListItem('nome_razao_social="QA_TEST_PARCEIRO"')
            .catch(() => null)
          if (!parceiro)
            parceiro = await pb
              .collection('parceiros_negocios')
              .create({ nome_razao_social: 'QA_TEST_PARCEIRO' })
          return {
            data_competencia: new Date().toISOString(),
            data_vencimento: new Date().toISOString(),
            descricao_lancamento: 'QA_TEST_TRANSACAO',
            parceiro_id: parceiro.id,
            tipo_movimento: 'Receita',
            classificacao_custo: 'FIXA',
            centro_custo: 'CC01',
            valor_total: 100,
            status_pagamento: 'Pendente',
          }
        },
      },
      {
        name: 'manejo_iatf_curral',
        mock: async () => {
          let animal = await pb
            .collection('animais')
            .getFirstListItem('id_manejo_brinco="QA_TEST_BRINCO"')
            .catch(() => null)
          if (!animal)
            animal = await pb.collection('animais').create({ id_manejo_brinco: 'QA_TEST_BRINCO' })
          return {
            matriz_id: animal.id,
            data_iatf: new Date().toISOString(),
          }
        },
      },
      {
        name: 'pesagens_diarias',
        mock: async () => {
          let animal = await pb
            .collection('animais')
            .getFirstListItem('id_manejo_brinco="QA_TEST_BRINCO"')
            .catch(() => null)
          if (!animal)
            animal = await pb.collection('animais').create({ id_manejo_brinco: 'QA_TEST_BRINCO' })
          return {
            animal_id: animal.id,
            data_pesagem: new Date().toISOString(),
            peso_kg: 100,
          }
        },
      },
    ]

    for (const col of depCollections) {
      try {
        await pb.collection(col.name).getList(1, 1)
        const mockData = await col.mock()
        const created = await pb.collection(col.name).create(mockData)
        await pb.collection(col.name).update(created.id, mockData)
        await pb.collection(col.name).delete(created.id)

        updateStatus(col.name, 'success', 'Ciclo CRUD completo com sucesso')
        addLog(
          col.name,
          'CRUD Completo',
          'success',
          'Read, Create, Update, Delete testados com sucesso',
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro no ciclo CRUD'
        updateStatus(col.name, 'error', msg)
        addLog(col.name, 'CRUD Completo', 'error', msg)
      }
    }

    // Clean up mock dependencies if they were left behind
    try {
      const p = await pb
        .collection('parceiros_negocios')
        .getFirstListItem('nome_razao_social="QA_TEST_PARCEIRO"')
        .catch(() => null)
      if (p) await pb.collection('parceiros_negocios').delete(p.id)
    } catch (_) {
      // Ignore errors during cleanup
    }
    try {
      const a = await pb
        .collection('animais')
        .getFirstListItem('id_manejo_brinco="QA_TEST_BRINCO"')
        .catch(() => null)
      if (a) await pb.collection('animais').delete(a.id)
    } catch (_) {
      // Ignore errors during cleanup
    }

    setIsChecking(false)
    checkPWA()
  }

  useEffect(() => {
    runChecks()
    const interval = setInterval(checkPWA, 5000)
    return () => clearInterval(interval)
  }, [])

  const successCount = checks.filter((c) => c.status === 'success').length
  const totalCount = checks.length
  const progress = totalCount === 0 ? 0 : Math.round((successCount / totalCount) * 100)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight text-[#1a1a2e] flex items-center gap-2">
          <ShieldCheck className="h-8 w-8" />
          QA & Integridade
        </h2>
        <Button
          onClick={runChecks}
          disabled={isChecking}
          className="bg-[#1a1a2e] hover:bg-[#1a1a2e]/90 text-white min-h-[48px] w-full md:w-auto"
        >
          <RefreshCw className={cn('mr-2 h-4 w-4', isChecking && 'animate-spin')} />
          {isChecking ? 'Executando...' : 'Reexecutar Testes'}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-white border p-1 flex-wrap h-auto shadow-sm">
          <TabsTrigger
            value="overview"
            className="min-h-[40px] data-[state=active]:bg-[#1a1a2e] data-[state=active]:text-white"
          >
            Visão Geral
          </TabsTrigger>
          <TabsTrigger
            value="health"
            className="min-h-[40px] data-[state=active]:bg-[#1a1a2e] data-[state=active]:text-white"
          >
            Health Checks
          </TabsTrigger>
          <TabsTrigger
            value="coverage"
            className="min-h-[40px] data-[state=active]:bg-[#1a1a2e] data-[state=active]:text-white"
          >
            Relatório de Cobertura
          </TabsTrigger>
          <TabsTrigger
            value="pwa"
            className="min-h-[40px] data-[state=active]:bg-[#1a1a2e] data-[state=active]:text-white"
          >
            PWA & Offline
          </TabsTrigger>
          <TabsTrigger
            value="responsive"
            className="min-h-[40px] data-[state=active]:bg-[#1a1a2e] data-[state=active]:text-white"
          >
            Responsividade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-[#1a1a2e] text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" /> Status de Cobertura do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <div className="text-6xl font-black text-[#1a1a2e]">{progress}%</div>
                <Progress
                  value={progress}
                  className="w-full md:w-[60%] h-4 bg-slate-200 [&>div]:bg-[#1a1a2e]"
                />
                <p className="text-slate-500 text-center">
                  {successCount} de {totalCount} módulos/componentes estão operacionais.
                </p>
                {progress === 100 ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 min-h-[32px] px-4 text-sm mt-4 text-white">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> 100% Operacional
                  </Badge>
                ) : (
                  <Badge className="bg-black hover:bg-black/80 min-h-[32px] px-4 text-sm mt-4 text-white">
                    <XCircle className="mr-2 h-4 w-4" /> Atenção Necessária
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {checks.map((check, i) => (
              <Card key={i} className="border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2 text-black font-semibold">
                      {check.name === 'PocketBase Connection' ? (
                        <Server className="h-4 w-4 text-[#1a1a2e]" />
                      ) : (
                        <Database className="h-4 w-4 text-[#1a1a2e]" />
                      )}
                      <span className="truncate max-w-[150px] sm:max-w-[200px]" title={check.name}>
                        {check.name}
                      </span>
                    </span>
                    {check.status === 'pending' && <Badge variant="outline">Testando...</Badge>}
                    {check.status === 'success' && (
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 shrink-0 text-white">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> OK
                      </Badge>
                    )}
                    {check.status === 'error' && (
                      <Badge className="bg-black text-white hover:bg-black/80 shrink-0">
                        <XCircle className="mr-1 h-3 w-3" /> Erro
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">
                    {check.message || 'Aguardando execução...'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="coverage" className="space-y-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1a1a2e]">
                <History className="h-5 w-5" /> Histórico de Testes
              </CardTitle>
              <CardDescription>
                Últimos {logs.length} registros de execução das rotinas automatizadas de QA.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum teste executado ainda.</p>
                ) : (
                  <div className="border rounded-md divide-y overflow-hidden bg-white">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 gap-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                          <Badge
                            variant="outline"
                            className="w-max bg-slate-50 text-black border-slate-200"
                          >
                            {log.module}
                          </Badge>
                          <span className="text-sm font-medium text-slate-700">{log.testType}</span>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                          <span
                            className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-xs"
                            title={log.message}
                          >
                            {log.message}
                          </span>
                          {log.result === 'success' ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white ml-2 whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Sucesso
                            </Badge>
                          ) : (
                            <Badge className="bg-black hover:bg-black/80 text-white ml-2 whitespace-nowrap">
                              <XCircle className="w-3 h-3 mr-1" /> Falha
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pwa" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Status da Rede</CardTitle>
                {pwaStatus.online ? (
                  <Wifi className="h-4 w-4 text-emerald-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-black" />
                )}
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${pwaStatus.online ? 'text-emerald-600' : 'text-black'}`}
                >
                  {pwaStatus.online ? 'Online' : 'Offline'}
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Service Worker</CardTitle>
                <ShieldCheck className="h-4 w-4 text-[#1a1a2e]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">
                  {pwaStatus.sw ? 'Ativo' : 'Inativo'}
                </div>
                <p className="text-xs text-slate-500">
                  {pwaStatus.sw ? 'Cache operacional' : 'Faltando registro'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Fila Offline</CardTitle>
                <RefreshCw className="h-4 w-4 text-[#1a1a2e]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{pwaStatus.queueCount}</div>
                <p className="text-xs text-slate-500">ações pendentes</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Manifesto PWA</CardTitle>
                <FileCode2 className="h-4 w-4 text-[#1a1a2e]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">
                  {pwaStatus.manifest ? 'Detectado' : 'Ausente'}
                </div>
                <p className="text-xs text-slate-500">
                  {pwaStatus.manifest ? 'Pronto p/ instalação' : 'Verifique index.html'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="responsive" className="space-y-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#1a1a2e]">Guia de Responsividade</CardTitle>
              <CardDescription>
                Valide o comportamento da interface nos principais breakpoints (320px, 768px,
                1920px).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={iframeWidth === '320px' ? 'default' : 'outline'}
                  onClick={() => setIframeWidth('320px')}
                  className={cn(
                    'min-h-[48px] transition-colors',
                    iframeWidth === '320px' && 'bg-[#1a1a2e] text-white hover:bg-[#1a1a2e]/90',
                  )}
                >
                  <Smartphone className="mr-2 h-4 w-4" /> Mobile (320px)
                </Button>
                <Button
                  variant={iframeWidth === '768px' ? 'default' : 'outline'}
                  onClick={() => setIframeWidth('768px')}
                  className={cn(
                    'min-h-[48px] transition-colors',
                    iframeWidth === '768px' && 'bg-[#1a1a2e] text-white hover:bg-[#1a1a2e]/90',
                  )}
                >
                  <Tablet className="mr-2 h-4 w-4" /> Tablet (768px)
                </Button>
                <Button
                  variant={iframeWidth === '1920px' ? 'default' : 'outline'}
                  onClick={() => setIframeWidth('1920px')}
                  className={cn(
                    'min-h-[48px] transition-colors',
                    iframeWidth === '1920px' && 'bg-[#1a1a2e] text-white hover:bg-[#1a1a2e]/90',
                  )}
                >
                  <Laptop className="mr-2 h-4 w-4" /> Desktop (1920px)
                </Button>
                <Button
                  variant={iframeWidth === '100%' ? 'default' : 'outline'}
                  onClick={() => setIframeWidth('100%')}
                  className={cn(
                    'min-h-[48px] transition-colors',
                    iframeWidth === '100%' && 'bg-[#1a1a2e] text-white hover:bg-[#1a1a2e]/90',
                  )}
                >
                  <Laptop className="mr-2 h-4 w-4" /> Full Width
                </Button>
              </div>
              <div className="bg-slate-200 rounded-xl p-4 flex justify-center overflow-auto border-2 border-[#1a1a2e] shadow-inner">
                <div
                  style={{ width: iframeWidth, transition: 'width 0.3s ease-in-out' }}
                  className="bg-white rounded-lg shadow-xl overflow-hidden h-[600px] border border-slate-300 relative"
                >
                  <iframe
                    src={window.location.origin}
                    className="w-full h-full border-0"
                    title="Responsive Tester"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
