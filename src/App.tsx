import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/stores/useAppStore'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

import { Component, ErrorInfo, ReactNode, useEffect } from 'react'
import Layout from './components/Layout'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-white min-h-screen text-black flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-emerald-900 mb-4">Ocorreu um erro inesperado.</h2>
          <p className="text-gray-600 mb-6">Tente recarregar a página ou contate o suporte.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-emerald-800 text-white px-4 py-2 rounded-md hover:bg-emerald-900 transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
import { BackgroundSync } from './components/BackgroundSync'
import Login from './pages/Login'
import RegisterUser from './pages/admin/RegisterUser'
import ForgotPassword from './pages/ForgotPassword'
import NotFound from './pages/NotFound'
import Dashboard from './pages/Dashboard'
import Desempenho from './pages/dashboard/Desempenho'
import Auditoria from './pages/admin/Auditoria'
import Importacao from './pages/rebanho/ImportarAnimais'
import ImportadorFornecedores from './pages/admin/ImportadorFornecedores'
import ImportadorNotasFiscais from './pages/admin/ImportadorNotasFiscais'
import Animais from './pages/rebanho/Animais'
import AnimalPerfil from './pages/rebanho/AnimalPerfil'
import DespesasPagamentos from './pages/financeiro/DespesasPagamentos'
import RecebimentoBoletos from './pages/financeiro/RecebimentoBoletos'
import GestaoVendas from './pages/vendas/GestaoVendas'
import VendaForm from './pages/vendas/VendaForm'
import VendaDetalhes from './pages/vendas/VendaDetalhes'
import EventoDetalhes from './pages/vendas/EventoDetalhes'
import Clima from './pages/operacoes/Clima'
import Mercado from './pages/operacoes/Mercado'
import DiagnosticoInicial from './pages/estrategia/DiagnosticoInicial'
import GestaoLotes from './pages/cadastros/LotesTab'
import Pastos from './pages/estrutura/Pastos'
import Apartacao from './pages/rebanho/Apartacao'
import Inventario from './pages/rebanho/Inventario'
import EstoqueRebanho from './pages/rebanho/EstoqueRebanho'
import Pesagem from './pages/rebanho/Pesagem'
import Reproducao from './pages/reproducao/Reproducao'
import MetasKPIs from './pages/estrategia/MetasKPIs'
import SimuladorCenarios from './pages/estrategia/SimuladorCenarios'
import DashboardEstoque from './pages/estoque/DashboardEstoque'
import CadastroManual from './pages/estoque/CadastroManual'
import ReceitasRacao from './pages/estoque/ReceitasRacao'
import ReceitaForm from './pages/estoque/ReceitaForm'
import ProducaoRacao from './pages/estoque/ProducaoRacao'
import SaidaRacao from './pages/estoque/SaidaRacao'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RestrictedAccess({ userRole }: { userRole: string }) {
  const { toast } = useToast()

  useEffect(() => {
    const timer = setTimeout(() => {
      toast({
        title: 'Acesso Restrito',
        description: 'Você não tem permissão para acessar este módulo.',
        variant: 'destructive',
      })
    }, 50)
    return () => clearTimeout(timer)
  }, [toast])

  if (userRole === 'Operacional') return <Navigate to="/animais" replace />
  if (userRole === 'Financeiro') return <Navigate to="/desempenho" replace />
  return <Navigate to="/" replace />
}

const AuthorizeRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles?: string[]
}) => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  // Removed RBAC role checks to grant universal access to all authenticated users
  return <ErrorBoundary>{children}</ErrorBoundary>
}

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

const AppRoutes = () => (
  <Routes>
    <Route
      path="/login"
      element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      }
    />

    <Route path="/forgot-password" element={<Navigate to="/recuperar-senha" replace />} />
    <Route
      path="/recuperar-senha"
      element={
        <PublicRoute>
          <ForgotPassword />
        </PublicRoute>
      }
    />
    <Route
      element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }
    >
      <Route
        path="/"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro']}>
            <Dashboard />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/desempenho"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro']}>
            <Desempenho />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/auditoria"
        element={
          <AuthorizeRoute allowedRoles={['Gerente']}>
            <Auditoria />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/usuarios/novo"
        element={
          <AuthorizeRoute allowedRoles={['Gerente']}>
            <RegisterUser />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/importador-fornecedores"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro']}>
            <ImportadorFornecedores />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/importador-notas"
        element={
          <AuthorizeRoute allowedRoles={['Gerente']}>
            <ImportadorNotasFiscais />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/importacao"
        element={
          <AuthorizeRoute allowedRoles={['Gerente']}>
            <Importacao />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/animais"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro', 'Operacional']}>
            <Animais />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/animais/:id"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro', 'Operacional']}>
            <AnimalPerfil />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/despesas"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro']}>
            <DespesasPagamentos />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/lotes"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro', 'Operacional']}>
            <GestaoLotes />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/pastos"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro', 'Operacional']}>
            <Pastos />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/apartacao"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro', 'Operacional']}>
            <Apartacao />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/inventario"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro', 'Operacional']}>
            <Inventario />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/estoque-rebanho"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro']}>
            <EstoqueRebanho />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/pesagem"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro', 'Operacional']}>
            <Pesagem />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/reproducao"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro', 'Operacional']}>
            <Reproducao />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/controle-recebimento"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro']}>
            <RecebimentoBoletos />
          </AuthorizeRoute>
        }
      />
      <Route path="/vendas" element={<Navigate to="/vendas/geral" replace />} />
      <Route
        path="/vendas/geral"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro']}>
            <GestaoVendas />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/vendas/nova"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro']}>
            <VendaForm />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/vendas/editar/:id"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro']}>
            <VendaForm />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/vendas/geral/:id"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro']}>
            <VendaDetalhes />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/vendas/eventos/:id"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro']}>
            <EventoDetalhes />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/clima"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro']}>
            <Clima />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/mercado"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro']}>
            <Mercado />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/diagnostico-inicial"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro']}>
            <DiagnosticoInicial />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/metas-kpis"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro']}>
            <MetasKPIs />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/simulador-cenarios"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro']}>
            <SimuladorCenarios />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/estoque/dashboard"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro']}>
            <DashboardEstoque />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/estoque/cadastro-manual"
        element={
          <AuthorizeRoute allowedRoles={['Gerente']}>
            <CadastroManual />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/receitas-racao"
        element={
          <AuthorizeRoute allowedRoles={['Gerente']}>
            <ReceitasRacao />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/receitas-racao/nova"
        element={
          <AuthorizeRoute allowedRoles={['Gerente']}>
            <ReceitaForm />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/receitas-racao/editar/:id"
        element={
          <AuthorizeRoute allowedRoles={['Gerente']}>
            <ReceitaForm />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/fabrica/producao"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro', 'Operacional']}>
            <ProducaoRacao />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/estoque/saida-racao"
        element={
          <AuthorizeRoute allowedRoles={['Gerente', 'Financeiro', 'Operacional']}>
            <SaidaRacao />
          </AuthorizeRoute>
        }
      />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
)
const App = () => (
  <AuthProvider>
    <AppProvider>
      <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BackgroundSync />
          <AppRoutes />
        </TooltipProvider>
      </BrowserRouter>
    </AppProvider>
  </AuthProvider>
)

export default App
