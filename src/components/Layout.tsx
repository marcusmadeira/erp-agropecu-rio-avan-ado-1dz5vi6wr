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
} from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { useEffect } from 'react'
import { useAlerts } from '@/hooks/useAlerts'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

const navItems = [
  { module: 'Dashboard', icon: Home, path: '/', levels: [1, 2] },
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
  { module: 'Auditoria', icon: ShieldCheck, path: '/auditoria', levels: [1] },
]

export default function Layout() {
  const { state, dispatch } = useAppStore()
  const navigate = useNavigate()
  const location = useLocation()
  const alerts = useAlerts()

  const handleLogout = () => {
    dispatch((s) => ({ ...s, isAuthenticated: false, currentUser: null }))
    navigate('/login')
  }

  useEffect(() => {
    if (
      state.userRole === 3 &&
      (location.pathname === '/' ||
        location.pathname.startsWith('/transacoes') ||
        location.pathname.startsWith('/auditoria'))
    ) {
      navigate('/manejo')
    }
  }, [state.userRole, location.pathname, navigate])

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
                      mod.items.map((i) => (
                        <SidebarMenuItem key={i.path}>
                          <SidebarMenuButton
                            asChild
                            isActive={location.pathname === i.path}
                            className="rounded-md"
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
                          className="rounded-md"
                        >
                          <Link to={mod.path!}>Acessar Panel</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </SidebarGroup>
              ))}
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <header className="h-16 flex items-center justify-between px-6 border-b bg-white shadow-subtle z-10 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="font-semibold text-lg text-emerald-900 hidden sm:block">
                Painel de Gestão Avançado
              </h1>
            </div>
            <div className="flex items-center gap-4">
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
              <div className="flex items-center gap-3 border-l pl-4 border-slate-200">
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
          <div className="flex-1 overflow-y-auto p-4 md:p-8 animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
