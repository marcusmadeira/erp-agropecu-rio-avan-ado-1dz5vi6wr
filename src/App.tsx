import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/stores/useAppStore'
import useAppStore from '@/stores/useAppStore'
import { AuthProvider, useAuth } from '@/hooks/use-auth'

import { Component, ErrorInfo, ReactNode } from 'react'
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

const AuthorizeRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles: number[]
}) => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  const getRoleLevel = (u: any) => {
    if (!u) return 3
    if (u.role === 'Admin' || u.nivel_acesso === 'Gerente') return 1
    if (u.nivel_acesso === 'Financeiro') return 2
    return 3
  }

  const userRole = getRoleLevel(user)
  if (!allowedRoles.includes(userRole)) {
    if (userRole === 3) return <Navigate to="/animais" replace />
    if (userRole === 2) return <Navigate to="/desempenho" replace />
    return <Navigate to="/" replace />
  }

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
          <AuthorizeRoute allowedRoles={[1, 2]}>
            <Dashboard />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/desempenho"
        element={
          <AuthorizeRoute allowedRoles={[1, 2]}>
            <Desempenho />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/auditoria"
        element={
          <AuthorizeRoute allowedRoles={[1]}>
            <Auditoria />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/usuarios/novo"
        element={
          <AuthorizeRoute allowedRoles={[1]}>
            <RegisterUser />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/importador-fornecedores"
        element={
          <AuthorizeRoute allowedRoles={[1, 2]}>
            <ImportadorFornecedores />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/importador-notas"
        element={
          <AuthorizeRoute allowedRoles={[1]}>
            <ImportadorNotasFiscais />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/importacao"
        element={
          <AuthorizeRoute allowedRoles={[1]}>
            <Importacao />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/animais"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <Animais />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/animais/:id"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <AnimalPerfil />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/despesas"
        element={
          <AuthorizeRoute allowedRoles={[1, 2]}>
            <DespesasPagamentos />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/lotes"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <GestaoLotes />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/apartacao"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <Apartacao />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/inventario"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <Inventario />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/estoque-rebanho"
        element={
          <AuthorizeRoute allowedRoles={[1, 2]}>
            <EstoqueRebanho />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/pesagem"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <Pesagem />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/reproducao"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <Reproducao />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/controle-recebimento"
        element={
          <AuthorizeRoute allowedRoles={[1, 2]}>
            <RecebimentoBoletos />
          </AuthorizeRoute>
        }
      />
      <Route path="/vendas" element={<Navigate to="/vendas/geral" replace />} />
      <Route
        path="/vendas/geral"
        element={
          <AuthorizeRoute allowedRoles={[1, 2]}>
            <GestaoVendas />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/vendas/nova"
        element={
          <AuthorizeRoute allowedRoles={[1, 2]}>
            <VendaForm />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/vendas/editar/:id"
        element={
          <AuthorizeRoute allowedRoles={[1, 2]}>
            <VendaForm />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/vendas/geral/:id"
        element={
          <AuthorizeRoute allowedRoles={[1, 2]}>
            <VendaDetalhes />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/vendas/eventos/:id"
        element={
          <AuthorizeRoute allowedRoles={[1, 2]}>
            <EventoDetalhes />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/clima"
        element={
          <AuthorizeRoute allowedRoles={[1, 2]}>
            <Clima />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/mercado"
        element={
          <AuthorizeRoute allowedRoles={[1, 2]}>
            <Mercado />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/diagnostico-inicial"
        element={
          <AuthorizeRoute allowedRoles={[1, 2]}>
            <DiagnosticoInicial />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/metas-kpis"
        element={
          <AuthorizeRoute allowedRoles={[1, 2]}>
            <MetasKPIs />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/simulador-cenarios"
        element={
          <AuthorizeRoute allowedRoles={[1, 2]}>
            <SimuladorCenarios />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/estoque/dashboard"
        element={
          <AuthorizeRoute allowedRoles={[1, 2]}>
            <DashboardEstoque />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/estoque/cadastro-manual"
        element={
          <AuthorizeRoute allowedRoles={[1]}>
            <CadastroManual />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/receitas-racao"
        element={
          <AuthorizeRoute allowedRoles={[1]}>
            <ReceitasRacao />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/receitas-racao/nova"
        element={
          <AuthorizeRoute allowedRoles={[1]}>
            <ReceitaForm />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/receitas-racao/editar/:id"
        element={
          <AuthorizeRoute allowedRoles={[1]}>
            <ReceitaForm />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/fabrica/producao"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <ProducaoRacao />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/estoque/saida-racao"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
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
