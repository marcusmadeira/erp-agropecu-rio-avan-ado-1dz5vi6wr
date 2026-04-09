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
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getOfflineQueue } from '@/lib/offline-sync'
import { cn } from '@/lib/utils'

type CheckResult = {
  name: string
  status: 'pending' | 'success' | 'error'
  message?: string
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
  const [pwaStatus, setPwaStatus] = useState({
    online: navigator.onLine,
    sw: false,
    queueCount: 0,
  })

  const checkPWA = () => {
    setPwaStatus({
      online: navigator.onLine,
      sw: !!navigator.serviceWorker?.controller,
      queueCount: getOfflineQueue().length,
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
    } catch (err) {
      updateStatus(
        'PocketBase Connection',
        'error',
        err instanceof Error ? err.message : 'Falha na conexão',
      )
    }

    // 2. Collections CRUD schema access validation
    const collections = [
      'parceiros_negocios',
      'lotes',
      'animais',
      'estoque_insumos',
      'transacoes_financeiras',
      'manejo_iatf_curral',
      'pesagens_diarias',
    ]

    await Promise.all(
      collections.map(async (col) => {
        try {
          await pb.collection(col).getList(1, 1)
          updateStatus(col, 'success', 'Operação de leitura (CRUD Read) bem sucedida')
        } catch (err) {
          updateStatus(col, 'error', err instanceof Error ? err.message : 'Erro na leitura')
        }
      }),
    )

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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight text-blue-950 flex items-center gap-2">
          <ShieldCheck className="h-8 w-8" />
          QA & Integridade
        </h2>
        <Button
          onClick={runChecks}
          disabled={isChecking}
          className="bg-blue-950 hover:bg-blue-900 text-white min-h-[48px] w-full md:w-auto"
        >
          <RefreshCw className={cn('mr-2 h-4 w-4', isChecking && 'animate-spin')} />
          Reexecutar Testes
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-100 p-1 flex-wrap h-auto">
          <TabsTrigger value="overview" className="min-h-[40px]">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="health" className="min-h-[40px]">
            Health Checks
          </TabsTrigger>
          <TabsTrigger value="pwa" className="min-h-[40px]">
            PWA & Offline
          </TabsTrigger>
          <TabsTrigger value="responsive" className="min-h-[40px]">
            Responsividade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="bg-blue-950 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" /> Status de Cobertura do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <div className="text-6xl font-black text-blue-950">{progress}%</div>
                <Progress value={progress} className="w-full md:w-[60%] h-4" />
                <p className="text-muted-foreground text-center">
                  {successCount} de {totalCount} módulos/componentes estão operacionais.
                </p>
                {progress === 100 ? (
                  <Badge className="bg-green-600 hover:bg-green-700 min-h-[32px] px-4 text-sm mt-4">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> 100% Operacional
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="min-h-[32px] px-4 text-sm mt-4">
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
              <Card key={i} className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-800">
                      {check.name === 'PocketBase Connection' ? (
                        <Server className="h-4 w-4 text-blue-950" />
                      ) : (
                        <Database className="h-4 w-4 text-blue-950" />
                      )}
                      <span className="truncate max-w-[150px] sm:max-w-[200px]" title={check.name}>
                        {check.name}
                      </span>
                    </span>
                    {check.status === 'pending' && <Badge variant="outline">Testando...</Badge>}
                    {check.status === 'success' && (
                      <Badge className="bg-green-600 hover:bg-green-700 shrink-0">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> OK
                      </Badge>
                    )}
                    {check.status === 'error' && (
                      <Badge variant="destructive" className="shrink-0">
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

        <TabsContent value="pwa" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Status da Rede</CardTitle>
                {pwaStatus.online ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${pwaStatus.online ? 'text-green-600' : 'text-red-600'}`}
                >
                  {pwaStatus.online ? 'Online' : 'Offline'}
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Service Worker (PWA)
                </CardTitle>
                <ShieldCheck className="h-4 w-4 text-blue-950" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {pwaStatus.sw ? 'Ativo' : 'Inativo'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {pwaStatus.sw ? 'Cache operacional' : 'Faltando registro'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Fila de Sincronização
                </CardTitle>
                <RefreshCw className="h-4 w-4 text-blue-950" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{pwaStatus.queueCount}</div>
                <p className="text-xs text-muted-foreground">ações pendentes</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="responsive" className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Validador de Responsividade</CardTitle>
              <CardDescription>
                Simule o comportamento do layout em diferentes resoluções de tela.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={iframeWidth === '320px' ? 'default' : 'outline'}
                  onClick={() => setIframeWidth('320px')}
                  className={cn(
                    'min-h-[48px]',
                    iframeWidth === '320px' && 'bg-blue-950 text-white hover:bg-blue-900',
                  )}
                >
                  <Smartphone className="mr-2 h-4 w-4" /> Mobile (320px)
                </Button>
                <Button
                  variant={iframeWidth === '768px' ? 'default' : 'outline'}
                  onClick={() => setIframeWidth('768px')}
                  className={cn(
                    'min-h-[48px]',
                    iframeWidth === '768px' && 'bg-blue-950 text-white hover:bg-blue-900',
                  )}
                >
                  <Tablet className="mr-2 h-4 w-4" /> Tablet (768px)
                </Button>
                <Button
                  variant={iframeWidth === '100%' ? 'default' : 'outline'}
                  onClick={() => setIframeWidth('100%')}
                  className={cn(
                    'min-h-[48px]',
                    iframeWidth === '100%' && 'bg-blue-950 text-white hover:bg-blue-900',
                  )}
                >
                  <Laptop className="mr-2 h-4 w-4" /> Desktop (Full)
                </Button>
              </div>
              <div className="bg-slate-200 rounded-xl p-4 flex justify-center overflow-auto border-2 border-slate-800">
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
