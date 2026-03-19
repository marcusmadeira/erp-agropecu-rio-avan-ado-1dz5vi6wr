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

const navItems = [
  { module: 'Dashboard', icon: Home, path: '/', levels: [1, 2, 3] },
  { module: 'Desempenho', icon: LineChart, path: '/nutricao', levels: [1, 2] },
  {
    module: 'Estrutura',
    icon: Map,
    items: [
      { name: 'Pastos', path: '/pastos' },
      { name: 'Lotes', path: '/lotes' },
    ],
    levels: [1, 2, 3],
  },
  {
    module: 'Rebanho',
    icon: Activity,
    items: [
      { name: 'Animais', path: '/animais' },
      { name: 'Curral Digital', path: '/pesagem' },
      { name: 'Reclassificação', path: '/reclassificacao' },
    ],
    levels: [1, 2, 3],
  },
  {
    module: 'Reprodução',
    icon: Baby,
    items: [
      { name: 'Eventos Repro', path: '/eventos-repro' },
      { name: 'Nascimentos', path: '/nascimentos' },
    ],
    levels: [1, 2, 3],
  },
  {
    module: 'Suprimentos',
    icon: Droplet,
    items: [
      { name: 'Estoque', path: '/estoque' },
      { name: 'Previsão de Demanda', path: '/previsao-demanda' },
      { name: 'Manejo', path: '/manejo' },
    ],
    levels: [1, 2, 3],
  },
  {
    module: 'Financeiro',
    icon: DollarSign,
    items: [
      { name: 'Transações', path: '/transacoes' },
      { name: 'Eventos Comerciais', path: '/eventos-comerciais' },
    ],
    levels: [1, 2],
  },
  {
    module: 'Operações',
    icon: Tractor,
    items: [
      { name: 'Maquinário', path: '/maquinario' },
      { name: 'Clima', path: '/clima' },
    ],
    levels: [1, 2, 3],
  },
  {
    module: 'Integrações',
    icon: Network,
    items: [
      { name: 'Inttegra API', path: '/inttegra' },
      { name: 'Importação (ETL)', path: '/importacao' },
    ],
    levels: [1],
  },
  { module: 'Auditoria', icon: ShieldCheck, path: '/auditoria', levels: [1] },
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

  useEffect(() => {
    if (
      state.userRole === 3 &&
      (location.pathname.startsWith('/transacoes') ||
        location.pathname.startsWith('/auditoria') ||
        location.pathname.startsWith('/inttegra') ||
        location.pathname.startsWith('/importacao') ||
        location.pathname.startsWith('/previsao-demanda'))
    ) {
      navigate('/')
    }
  }, [state.userRole, location.pathname, navigate])

  // Offline Data Synchronization Engine
  useEffect(() => {
    if (state.isOnline && state.pendingSyncQueue.length > 0 && !isSyncing) {
      // Auto-trigger sync when online
      handleManualSync()
    }
  }, [state.isOnline, state.pendingSyncQueue.length])

  const handleManualSync = () => {
    if (!state.isOnline) {
      toast({ title: 'Aviso', description: 'Você está offline.', variant: 'destructive' })
      return
    }

    setIsSyncing(true)

    // Simulate network request and conflict check
    setTimeout(() => {
      const hasConflict = Math.random() > 0.8 // 20% chance of a mock validation conflict

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
        <Sidebar className="border-r shadow-subtle">
          <SidebarHeader className="p-4 flex items-center h-16 border-b">
            <h2 className="font-bold text-emerald-900 tracking-tight text-lg">Agro ERP Elite</h2>
          </SidebarHeader>
          <SidebarContent className="p-2 gap-2">
            {navItems
              .filter((item) => item.levels.includes(state.userRole))
              .map((mod) => (
                <SidebarGroup key={mod.module}>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-emerald-900/60 uppercase">
                    <mod.icon className="w-4 h-4" />
                    {mod.module}
                  </div>
                  <SidebarMenu>
                    {mod.items ? (
                      mod.items.map((i) => {
                        // Hide specific modules from level 3
                        if (i.path === '/previsao-demanda' && state.userRole === 3) return null
                        if (i.path === '/importacao' && state.userRole !== 1) return null
                        return (
                          <SidebarMenuItem key={i.path}>
                            <SidebarMenuButton
                              asChild
                              isActive={location.pathname === i.path}
                              className="rounded-md"
                            >
                              <Link to={i.path}>{i.name}</Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )
                      })
                    ) : (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={location.pathname === mod.path}
                          className="rounded-md"
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
              <h1 className="font-semibold text-lg text-emerald-900 hidden sm:block">
                {state.userRole === 1
                  ? 'Gestão Executiva'
                  : state.userRole === 2
                    ? 'Gestão de Produção'
                    : 'Operação de Campo'}
              </h1>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              {/* Sync Status Dashboard */}
              <button
                className="hidden sm:flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSyncModalOpen(true)}
              >
                {!state.isOnline ? (
                  <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full text-xs font-medium border border-rose-100">
                    <CloudOff className="w-4 h-4" />
                    <span>Offline ({state.pendingSyncQueue.length} pendentes)</span>
                  </div>
                ) : isSyncing ? (
                  <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full text-xs font-medium border border-amber-100">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sincronizando...</span>
                  </div>
                ) : state.pendingSyncQueue.length > 0 ? (
                  <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full text-xs font-medium border border-amber-100">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Ação Pendente ({state.pendingSyncQueue.length})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-xs font-medium border border-emerald-100">
                    <Cloud className="w-4 h-4" />
                    <span>Sincronizado</span>
                  </div>
                )}
              </button>

              {/* Mobile Compact Sync Status */}
              <button
                className="flex sm:hidden items-center cursor-pointer"
                onClick={() => setSyncModalOpen(true)}
              >
                {!state.isOnline ? (
                  <CloudOff className="w-5 h-5 text-rose-500" />
                ) : isSyncing ? (
                  <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
                ) : state.pendingSyncQueue.length > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                ) : (
                  <Cloud className="w-5 h-5 text-emerald-600" />
                )}
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-emerald-900" />
                    {alerts.length > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse border border-white" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
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
                            <span className="font-semibold text-sm">{a.title}</span>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-normal">
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
                  <p className="font-semibold text-emerald-900 leading-none">
                    {state.currentUser?.name}
                  </p>
                  <span className="text-xs text-muted-foreground font-medium">
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
            <div className="bg-amber-100 border-b border-amber-200 px-4 py-2.5 flex items-center justify-center text-amber-800 text-xs sm:text-sm font-medium z-20 shrink-0 shadow-sm animate-fade-in">
              <CloudOff className="w-5 h-5 mr-2 shrink-0" />
              <span className="text-center">
                <strong>Modo Offline:</strong> Você está visualizando dados em cache. As alterações
                locais serão sincronizadas quando a conexão for restaurada.
              </span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-0 sm:p-4 md:p-8 animate-fade-in-up relative">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Conflict Management & Sync Queue Dialog */}
      <Dialog open={syncModalOpen} onOpenChange={setSyncModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw
                className={`w-5 h-5 ${isSyncing ? 'animate-spin text-amber-500' : 'text-emerald-700'}`}
              />
              Central de Sincronização Local
            </DialogTitle>
            <DialogDescription>
              {state.isOnline ? 'Você está online.' : 'Você está offline. Operando em Cache Local.'}
              {state.lastSync &&
                ` Última sincronização com sucesso: ${format(parseISO(state.lastSync), 'dd/MM/yyyy HH:mm')}`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-4">
            <h4 className="font-semibold text-sm text-slate-700 mb-2">
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
                        <span className="font-medium text-xs">{item.type}</span>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {JSON.stringify(item.payload)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {format(parseISO(item.timestamp), 'dd/MM HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-amber-600 border-amber-300 bg-amber-50"
                        >
                          Na Fila
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
                Nenhum registro pendente na fila.
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <Button
              variant="ghost"
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={clearQueue}
            >
              Descartar Pendentes
            </Button>
            <Button
              className="bg-emerald-800"
              onClick={handleManualSync}
              disabled={!state.isOnline || isSyncing || state.pendingSyncQueue.length === 0}
            >
              {isSyncing ? 'Enviando...' : 'Forçar Sincronização'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
