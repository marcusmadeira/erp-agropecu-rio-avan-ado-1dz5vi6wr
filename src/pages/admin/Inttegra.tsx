import { useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import { useInttegraSync } from '@/hooks/useInttegraSync'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Network,
  Server,
  RefreshCw,
  AlertTriangle,
  CloudDownload,
  CheckCircle2,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function Inttegra() {
  const { state } = useAppStore()
  const { testConnection, importInitialData, retryBatch } = useInttegraSync()
  const { inttegraConfig, syncMappings } = state

  const [token, setToken] = useState(inttegraConfig.token)
  const [url, setUrl] = useState(inttegraConfig.baseUrl)

  const handleTest = () => {
    testConnection(token, url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Network className="w-8 h-8 text-indigo-700" />
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Integração Inttegra</h2>
          <p className="text-sm text-muted-foreground">
            Configuração de API e sincronização bi-direcional de dados (BI & Benchmarking).
          </p>
        </div>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="config">Configuração API</TabsTrigger>
          <TabsTrigger value="actions">Ações / Batch</TabsTrigger>
          <TabsTrigger value="mapping">De-Para (Logs)</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="mt-4">
          <Card className="shadow-subtle max-w-2xl border-t-4 border-t-indigo-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-600" />
                Parâmetros de Conexão
              </CardTitle>
              <CardDescription>
                Credenciais fornecidas pelo portal Inttegra para comunicação segura.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">URL Base da API</label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.inttegra.com/v1/"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Chave API (Token)</label>
                <Input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Insira o Token JWT"
                />
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status Atual:</p>
                  <div className="flex items-center gap-2">
                    {inttegraConfig.status === 'Conectado' ? (
                      <Badge className="bg-emerald-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Conectado
                      </Badge>
                    ) : inttegraConfig.status === 'Falha' ? (
                      <Badge variant="destructive">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Falha
                      </Badge>
                    ) : inttegraConfig.status === 'Sincronizando' ? (
                      <Badge className="bg-amber-500">
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Conectando...
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Desconectado</Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs text-muted-foreground">Último Sucesso:</p>
                  <p className="text-sm font-medium">
                    {inttegraConfig.lastSync
                      ? format(parseISO(inttegraConfig.lastSync), 'dd/MM/yyyy HH:mm')
                      : 'Nunca'}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleTest}
                className="w-full mt-4 bg-indigo-700 hover:bg-indigo-800"
                disabled={inttegraConfig.status === 'Sincronizando'}
              >
                {inttegraConfig.status === 'Sincronizando'
                  ? 'Testando Conexão...'
                  : 'Salvar e Testar Conexão'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-subtle">
              <CardHeader>
                <CardTitle className="text-lg">Carga Inicial (Pull)</CardTitle>
                <CardDescription>
                  Busca dados históricos (Animais, Lotes, Pastos) do portal Inttegra e preenche o
                  sistema local.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  onClick={importInitialData}
                >
                  <CloudDownload className="w-4 h-4 mr-2" /> Importar Base do Inttegra
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-subtle">
              <CardHeader>
                <CardTitle className="text-lg">Rotina Batch (Retry/Push)</CardTitle>
                <CardDescription>
                  Re-envia registros com erro e busca alterações ocorridas no portal nas últimas
                  24h.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-emerald-800 hover:bg-emerald-900" onClick={retryBatch}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Simular Rotina Batch (02:00 AM)
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mapping" className="mt-4">
          <Card className="shadow-subtle">
            <CardHeader>
              <CardTitle>Mapeamento de Sincronização (De-Para)</CardTitle>
              <CardDescription>Registros linkados entre o ERP Skip e o Inttegra.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tabela</TableHead>
                    <TableHead>ID Skip (Local)</TableHead>
                    <TableHead>ID Inttegra (Remoto)</TableHead>
                    <TableHead>Status Sync</TableHead>
                    <TableHead>Log / Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncMappings.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-semibold text-slate-700">{m.localTable}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {m.localId}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-indigo-700 font-bold">
                        {m.remoteId || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            m.status === 'Sincronizado'
                              ? 'default'
                              : m.status === 'Erro_Sync'
                                ? 'destructive'
                                : 'secondary'
                          }
                          className={m.status === 'Sincronizado' ? 'bg-emerald-600' : ''}
                        >
                          {m.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-rose-600">{m.errorLog || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {syncMappings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        Nenhum registro mapeado ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
