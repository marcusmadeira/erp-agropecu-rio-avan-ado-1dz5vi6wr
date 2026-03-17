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
  Box,
  Activity,
  Stethoscope,
  Baby,
  Scissors,
  Droplet,
  DollarSign,
  Tractor,
  CloudRain,
  ShieldAlert,
} from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const navItems = [
  { module: 'Dashboard', icon: Home, path: '/', levels: [1, 2] },
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
]

export default function Layout() {
  const { state, setRole } = useAppStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (state.userRole === 3) {
      if (
        location.pathname === '/' ||
        location.pathname.startsWith('/transacoes') ||
        location.pathname.startsWith('/eventos-comerciais')
      ) {
        navigate('/manejo')
      }
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
              <Badge
                variant={
                  state.userRole === 1 ? 'default' : state.userRole === 2 ? 'secondary' : 'outline'
                }
                className="hidden sm:inline-flex"
              >
                {state.userRole === 1
                  ? 'CEO/Admin'
                  : state.userRole === 2
                    ? 'Gerente'
                    : 'Operacional'}
              </Badge>
              <Select value={state.userRole.toString()} onValueChange={(v) => setRole(Number(v))}>
                <SelectTrigger className="w-[140px] bg-slate-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">CEO (Nível 1)</SelectItem>
                  <SelectItem value="2">Gerente (Nível 2)</SelectItem>
                  <SelectItem value="3">Operação (Nível 3)</SelectItem>
                </SelectContent>
              </Select>
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
