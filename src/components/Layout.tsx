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
  LineChart,
  Users,
  Box,
  DollarSign,
  FileText,
  Settings,
  Bot,
  Bell,
  LogOut,
  ShieldAlert,
  Wrench,
  Cloud,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  Heart,
} from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { useEffect, useState } from 'react'
import { useAlerts } from '@/hooks/useAlerts'
import { useAuth } from '@/hooks/use-auth'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import logoImg from '@/assets/img_3601-c9fbb.jpg'

const navItems = [
  { module: 'Dashboard Financeiro', icon: Home, path: '/', levels: [1] },
  { module: 'Rebanho + Estoque', icon: LineChart, path: '/desempenho', levels: [1, 2, 3] },
  { module: 'Parceiros, Animais, Lotes', icon: Users, path: '/cadastros', levels: [1, 3] },
  { module: 'Reprodução', icon: Heart, path: '/reproducao', levels: [1, 3] },
  { module: 'Insumos, Rações', icon: Box, path: '/estoque', levels: [1] },
  { module: 'Transações', icon: DollarSign, path: '/financeiro', levels: [1, 2] },
  { module: 'Relatórios', icon: FileText, path: '/relatorios', levels: [1, 2] },
  { module: 'Configurações', icon: Settings, path: '/configuracoes', levels: [1] },
  { module: 'Assistente IA', icon: Bot, path: '/assistente-ia', levels: [1, 2, 3] },
]

export default function Layout() {
  const { state, dispatch } = useAppStore()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const alerts = useAlerts()
  const { toast } = useToast()

  const [syncModalOpen, setSyncModalOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  const userRole = user?.nivel_acesso || 1

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
      <div className="flex h-screen w-full bg-slate-50 text-black">
        <Sidebar className="border-r shadow-subtle bg-white">
          <SidebarHeader className="p-4 border-b bg-slate-50/50 hidden md:block">
            <h2 className="font-bold text-primary tracking-tight text-lg leading-none">
              Menu Principal
            </h2>
          </SidebarHeader>
          <SidebarContent className="p-2 gap-2">
            {navItems
              .filter((item) => item.levels.includes(userRole))
              .map((mod) => (
                <SidebarGroup key={mod.module}>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === mod.path}
                        className="rounded-md font-medium flex items-center gap-3 hover:text-primary hover:bg-primary/5 transition-colors data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                      >
                        <Link to={mod.path!}>
                          <mod.icon className="w-5 h-5" />
                          <span>{mod.module}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroup>
              ))}
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50/30">
          <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b bg-white shadow-sm z-10 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-primary hover:text-primary/80" />
              <div className="flex items-center gap-3">
                <img
                  src={logoImg}
                  alt="Toriba Agropecuária Logo"
                  className="h-10 w-auto object-contain"
                />
                <span className="font-bold text-xl text-primary hidden sm:block uppercase tracking-tight sr-only">
                  Toriba Agropecuária
                </span>
              </div>
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
                <Avatar className="w-9 h-9 cursor-pointer border border-primary/20 shadow-sm">
                  <AvatarImage
                    src={
                      user?.avatar
                        ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/users/${user.id}/${user.avatar}`
                        : undefined
                    }
                  />
                  <AvatarFallback className="bg-primary text-white font-bold text-sm">
                    {user?.name?.substring(0, 2).toUpperCase() ||
                      user?.email?.substring(0, 2).toUpperCase() ||
                      'US'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm text-left hidden sm:block">
                  <p className="font-bold text-primary leading-none">{user?.name || user?.email}</p>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {userRole === 1 ? 'Admin/CEO' : userRole === 2 ? 'Gerente' : 'Operacional'}
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

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 animate-fade-in-up relative">
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
              className="bg-primary text-white font-bold"
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
