import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  Home,
  Map,
  Activity,
  Baby,
  Droplet,
  DollarSign,
  Tractor,
  Bell,
  LogOut,
  ShieldAlert,
  Wrench,
  ShieldCheck,
  LineChart,
  Cloud,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  Network,
} from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { useEffect, useState } from 'react'
import { useAlerts } from '@/hooks/useAlerts'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format, parseISO } from 'date-fns'
import { ToribaLogo } from '@/components/ToribaLogo'

const navItems = [
  { module: 'Dashboard Financeiro', icon: Home, path: '/', levels: [1, 2] },
  { module: 'Desempenho (Produção)', icon: LineChart, path: '/desempenho', levels: [1, 2] },
  {
    module: 'Estrutura',
    icon: Map,
    items: [
      { name: 'Pastos', path: '/pastos', levels: [1, 2] },
      { name: 'Lotes', path: '/lotes', levels: [1, 2] },
    ],
    levels: [1, 2],
  },
  {
    module: 'Rebanho',
    icon: Activity,
    items: [
      { name: 'Animais', path: '/animais', levels: [1, 2] },
      { name: 'Curral Digital', path: '/pesagem', levels: [1, 2, 3] },
      { name: 'Apartação', path: '/apartacao', levels: [1, 2] },
      { name: 'Reclassificação', path: '/reclassificacao', levels: [1, 2] },
    ],
    levels: [1, 2, 3],
  },
  {
    module: 'Reprodução',
    icon: Baby,
    items: [
      { name: 'Eventos Repro', path: '/eventos-repro', levels: [1, 2] },
      { name: 'Nascimentos', path: '/nascimentos', levels: [1, 2] },
    ],
    levels: [1, 2],
  },
  {
    module: 'Suprimentos',
    icon: Droplet,
    items: [
      { name: 'Estoque', path: '/estoque', levels: [1, 2] },
      { name: 'Previsão de Demanda', path: '/previsao-demanda', levels: [1, 2] },
      { name: 'Fábrica de Ração', path: '/fabrica-racao', levels: [1, 2, 3] },
      { name: 'Manejo Diário', path: '/manejo', levels: [1, 2, 3] },
    ],
    levels: [1, 2, 3],
  },
  {
    module: 'Financeiro / Cadastros',
    icon: DollarSign,
    items: [
      { name: 'Parceiros de Negócios', path: '/parceiros', levels: [1, 2] },
      { name: 'Transações DRE', path: '/transacoes', levels: [1, 2] },
      { name: 'Eventos Comerciais', path: '/eventos-comerciais', levels: [1, 2] },
    ],
    levels: [1, 2],
  },
  {
    module: 'Operações',
    icon: Tractor,
    items: [
      { name: 'Maquinário', path: '/maquinario', levels: [1, 2] },
      { name: 'Clima', path: '/clima', levels: [1, 2] },
    ],
    levels: [1, 2],
  },
  {
    module: 'Integrações',
    icon: Network,
    items: [
      { name: 'Inttegra API', path: '/inttegra', levels: [1] },
      { name: 'Importação (ETL)', path: '/importacao', levels: [1] },
    ],
    levels: [1],
  },
  { module: 'Auditoria & Config', icon: ShieldCheck, path: '/auditoria', levels: [1] },
]

export default function Layout() {
  const { state, dispatch } = useAppStore()
  const navigate = useNavigate()
  const location = useLocation()
  const alerts = useAlerts()
  const { toast } = useToast()

  const [syncModalOpen, setSyncModalOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const handleLogout = () => {
    dispatch((s) => ({ ...s, isAuthenticated: false, currentUser: null }))
    navigate('/login')
  }

  // Security routing enforcement
  useEffect(() => {
    if (
      state.userRole === 3 &&
      location.pathname !== '/' &&
      location.pathname !== '/pesagem' &&
      location.pathname !== '/manejo' &&
      location.pathname !== '/fabrica-racao'
    ) {
      navigate('/')
    }
  }, [state.userRole, location.pathname, navigate])

  // Mock Weekly Backup
  useEffect(() => {
    const lastBackupStr = localStorage.getItem('last_weekly_backup')
    const lastBackup = lastBackupStr ? new Date(lastBackupStr) : new Date(0)
    const daysSince = Math.floor((new Date().getTime() - lastBackup.getTime()) / (1000 * 3600 * 24))

    if (daysSince >= 7 && state.userRole === 1) {
      setTimeout(() => {
        toast({
          title: 'Backup Semanal Automático',
          description: 'Dump completo do banco gerado em JSON e enviado para admin@toriba.com',
        })
        localStorage.setItem('last_weekly_backup', new Date().toISOString())
      }, 3000)
    }
  }, [state.userRole, toast])

  // Offline Data Synchronization Engine
  useEffect(() => {
    if (state.isOnline && state.pendingSyncQueue.length > 0 && !isSyncing) {
      handleManualSync()
    }
  }, [state.isOnline, state.pendingSyncQueue.length])

  const handleManualSync = () => {
    if (!state.isOnline) {
      toast({ title: 'Aviso', description: 'Você está offline.', variant: 'destructive' })
      return
    }

    setIsSyncing(true)
    setTimeout(() => {
      const hasConflict = Math.random() > 0.8 // 20% chance
      if (hasConflict && state.pendingSyncQueue.length > 0) {
        setIsSyncing(false)
        setSyncModalOpen(true)
        toast({
          title: 'Erro de Sincronização',
          description: 'Foram encontrados conflitos ou erros de validação nos registros pendentes.',
          variant: 'destructive',
        })
      } else {
        dispatch((s) => ({ ...s, pendingSyncQueue: [], lastSync: new Date().toISOString() }))
        setIsSyncing(false)
        toast({
          title: 'Sincronização Nuvem Concluída',
          description: 'Todos os registros em cache foram enviados com sucesso.',
        })
      }
    }, 1500)
  }

  const clearQueue = () => {
    dispatch((s) => ({ ...s, pendingSyncQueue: [] }))
    setSyncModalOpen(false)
    toast({ title: 'Fila Limpa', description: 'Os registros pendentes foram descartados.' })
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-50">
        <Sidebar className="border-r shadow-subtle bg-white">
          <SidebarHeader className="p-4 flex flex-col items-center justify-center h-28 border-b bg-slate-50/50">
            <ToribaLogo className="w-12 h-12 text-primary" />
            <h2 className="font-bold text-primary tracking-tight text-lg mt-2 leading-none">
              Toriba Agro
            </h2>
            <span className="text-[10px] text-muted-foreground mt-1 font-medium">
              Gestão Pecuária 360º
            </span>
          </SidebarHeader>
          <SidebarContent className="p-2 gap-2">
            {navItems
              .filter((item) => item.levels.includes(state.userRole))
              .map((mod) => (
                <SidebarGroup key={mod.module}>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-primary/70 uppercase tracking-wider">
                    <mod.icon className="w-4 h-4" />
                    {mod.module}
                  </div>
                  <SidebarMenu>
                    {mod.items ? (
                      mod.items
                        .filter((i) => !i.levels || i.levels.includes(state.userRole))
                        .map((i) => (
                          <SidebarMenuItem key={i.path}>
                            <SidebarMenuButton
                              asChild
                              isActive={location.pathname === i.path}
                              className="rounded-md font-medium"
                            >
                              <Link to={i.path}>{i.name}</Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))
                    ) : (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={location.pathname === mod.path}
                          className="rounded-md font-medium"
                        >
                          <Link to={mod.path!}>Acessar Módulo</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </SidebarGroup>
              ))}
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b bg-white shadow-subtle z-10 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="font-bold text-lg text-primary hidden sm:block">
                {state.userRole === 1
                  ? 'Gestão Executiva'
                  : state.userRole === 2
                    ? 'Gestão de Produção'
                    : 'Operação de Campo'}
              </h1>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <button
                className="hidden sm:flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSyncModalOpen(true)}
              >
                {!state.isOnline ? (
                  <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full text-xs font-bold border border-rose-100">
                    <CloudOff className="w-4 h-4" />
                    <span>Offline ({state.pendingSyncQueue.length})</span>
                  </div>
                ) : isSyncing ? (
                  <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full text-xs font-bold border border-amber-100">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sincronizando...</span>
                  </div>
                ) : state.pendingSyncQueue.length > 0 ? (
                  <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full text-xs font-bold border border-amber-100">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Pendente ({state.pendingSyncQueue.length})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-primary bg-primary/10 px-3 py-1.5 rounded-full text-xs font-bold border border-primary/20">
                    <Cloud className="w-4 h-4" />
                    <span>Sincronizado</span>
                  </div>
                )}
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-primary" />
                    {alerts.length > 0 && (
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse border-2 border-white" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground font-medium">
                      Nenhum alerta crítico ativo.
                    </div>
                  ) : (
                    alerts.map((a) => (
                      <DropdownMenuItem key={a.id} asChild>
                        <Link
                          to={a.link || '#'}
                          className="flex flex-col gap-1 items-start p-3 cursor-pointer border-b last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            {a.type === 'critical' ? (
                              <ShieldAlert className="w-4 h-4 text-rose-500" />
                            ) : (
                              <Wrench className="w-4 h-4 text-amber-500" />
                            )}
                            <span className="font-bold text-sm">{a.title}</span>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-normal font-medium">
                            {a.description}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center gap-3 border-l pl-3 sm:pl-4 border-slate-200">
                <div className="text-sm text-right hidden sm:block">
                  <p className="font-bold text-primary leading-none">{state.currentUser?.name}</p>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {state.currentUser?.role === 1
                      ? 'Admin/CEO'
                      : state.currentUser?.role === 2
                        ? 'Gerente'
                        : 'Operacional'}
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair do Sistema">
                  <LogOut className="w-5 h-5 text-rose-600" />
                </Button>
              </div>
            </div>
          </header>

          {!state.isOnline && (
            <div className="bg-amber-100 border-b border-amber-200 px-4 py-2.5 flex items-center justify-center text-amber-800 text-xs sm:text-sm font-bold z-20 shrink-0 shadow-sm animate-fade-in">
              <CloudOff className="w-5 h-5 mr-2 shrink-0" />
              <span className="text-center">
                Modo Offline: Visualizando cache. Sincronização na próxima conexão.
              </span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-0 sm:p-4 md:p-8 animate-fade-in-up relative">
            <Outlet />
          </div>
        </main>
      </div>

      <Dialog open={syncModalOpen} onOpenChange={setSyncModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <RefreshCw
                className={`w-5 h-5 ${isSyncing ? 'animate-spin text-amber-500' : 'text-primary'}`}
              />
              Sincronização Local
            </DialogTitle>
            <DialogDescription>
              {state.isOnline ? 'Você está online.' : 'Você está offline.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-4">
            <h4 className="font-bold text-sm text-slate-700 mb-2">
              Registros Pendentes ({state.pendingSyncQueue.length})
            </h4>
            {state.pendingSyncQueue.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ação</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.pendingSyncQueue.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className="font-bold text-xs">{item.type}</span>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {format(parseISO(item.timestamp), 'dd/MM HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-amber-600 border-amber-200 bg-amber-50"
                        >
                          Na Fila
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm font-medium border border-dashed rounded-lg">
                Fila Vazia.
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <Button
              variant="ghost"
              className="text-rose-600 hover:text-rose-700 font-bold"
              onClick={clearQueue}
            >
              Descartar
            </Button>
            <Button
              className="bg-primary text-primary-foreground font-bold"
              onClick={handleManualSync}
              disabled={!state.isOnline || isSyncing || state.pendingSyncQueue.length === 0}
            >
              Forçar Sync
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
