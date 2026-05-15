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
import PainelCobranca from './pages/financeiro/PainelCobranca'
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
import Reclassificacao from './pages/rebanho/Reclassificacao'
import Reproducao from './pages/reproducao/Reproducao'
import MetasKPIs from './pages/estrategia/MetasKPIs'
import SimuladorCenarios from './pages/estrategia/SimuladorCenarios'
import DashboardEstoque from './pages/estoque/DashboardEstoque'
import CadastroManual from './pages/estoque/CadastroManual'
import ReceitasRacao from './pages/estoque/ReceitasRacao'
import ReceitaForm from './pages/estoque/ReceitaForm'
import ProducaoRacao from './pages/estoque/ProducaoRacao'
import SaidaRacao from './pages/estoque/SaidaRacao'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ServiceUnavailable = ({ onRetry }: { onRetry: () => void }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
    <h2 className="text-2xl font-bold text-red-900 mb-4">Falha de Conexão</h2>
    <p className="text-gray-600 mb-6 max-w-md">
      Não foi possível conectar ao servidor. Verifique sua conexão com a internet ou tente
      novamente.
    </p>
    <Button onClick={onRetry} className="bg-red-800 text-white hover:bg-red-900 transition-colors">
      Tentar Novamente
    </Button>
  </div>
)

const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
    <Loader2 className="h-8 w-8 animate-spin text-emerald-800 mb-4" />
    <p className="text-gray-600">Verificando sessão, aguarde...</p>
  </div>
)

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, serverError, retryConnection } = useAuth()
  if (loading) return <LoadingScreen />
  if (serverError) return <ServiceUnavailable onRetry={retryConnection} />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

const AuthorizeRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, serverError, retryConnection } = useAuth()
  if (loading) return <LoadingScreen />
  if (serverError) return <ServiceUnavailable onRetry={retryConnection} />
  if (!user) return <Navigate to="/login" replace />

  return <ErrorBoundary>{children}</ErrorBoundary>
}

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, serverError, retryConnection } = useAuth()
  if (loading) return <LoadingScreen />
  if (serverError) return <ServiceUnavailable onRetry={retryConnection} />
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
          <AuthorizeRoute>
            <Dashboard />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/desempenho"
        element={
          <AuthorizeRoute>
            <Desempenho />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/auditoria"
        element={
          <AuthorizeRoute>
            <Auditoria />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/usuarios/novo"
        element={
          <AuthorizeRoute>
            <RegisterUser />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/importador-fornecedores"
        element={
          <AuthorizeRoute>
            <ImportadorFornecedores />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/importador-notas"
        element={
          <AuthorizeRoute>
            <ImportadorNotasFiscais />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/importacao"
        element={
          <ProtectedRoute>
            <Importacao />
          </ProtectedRoute>
        }
      />
      <Route
        path="/animais"
        element={
          <ProtectedRoute>
            <Animais />
          </ProtectedRoute>
        }
      />
      <Route
        path="/animais/:id"
        element={
          <ProtectedRoute>
            <AnimalPerfil />
          </ProtectedRoute>
        }
      />
      <Route
        path="/despesas"
        element={
          <AuthorizeRoute>
            <DespesasPagamentos />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/lotes"
        element={
          <ProtectedRoute>
            <GestaoLotes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pastos"
        element={
          <ProtectedRoute>
            <Pastos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/apartacao"
        element={
          <ProtectedRoute>
            <Apartacao />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reclassificacao"
        element={
          <ProtectedRoute>
            <Reclassificacao />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventario"
        element={
          <ProtectedRoute>
            <Inventario />
          </ProtectedRoute>
        }
      />
      <Route
        path="/estoque-rebanho"
        element={
          <ProtectedRoute>
            <EstoqueRebanho />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pesagem"
        element={
          <ProtectedRoute>
            <Pesagem />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reproducao"
        element={
          <ProtectedRoute>
            <Reproducao />
          </ProtectedRoute>
        }
      />
      <Route
        path="/controle-recebimento"
        element={
          <AuthorizeRoute>
            <RecebimentoBoletos />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/painel-cobranca"
        element={
          <AuthorizeRoute>
            <PainelCobranca />
          </AuthorizeRoute>
        }
      />
      <Route path="/vendas" element={<Navigate to="/vendas/geral" replace />} />
      <Route
        path="/vendas/geral"
        element={
          <AuthorizeRoute>
            <GestaoVendas />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/vendas/nova"
        element={
          <AuthorizeRoute>
            <VendaForm />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/vendas/editar/:id"
        element={
          <AuthorizeRoute>
            <VendaForm />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/vendas/geral/:id"
        element={
          <AuthorizeRoute>
            <VendaDetalhes />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/vendas/eventos/:id"
        element={
          <AuthorizeRoute>
            <EventoDetalhes />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/clima"
        element={
          <AuthorizeRoute>
            <Clima />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/mercado"
        element={
          <AuthorizeRoute>
            <Mercado />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/diagnostico-inicial"
        element={
          <AuthorizeRoute>
            <DiagnosticoInicial />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/metas-kpis"
        element={
          <AuthorizeRoute>
            <MetasKPIs />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/simulador-cenarios"
        element={
          <AuthorizeRoute>
            <SimuladorCenarios />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/estoque/dashboard"
        element={
          <AuthorizeRoute>
            <DashboardEstoque />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/estoque/cadastro-manual"
        element={
          <AuthorizeRoute>
            <CadastroManual />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/receitas-racao"
        element={
          <AuthorizeRoute>
            <ReceitasRacao />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/receitas-racao/nova"
        element={
          <AuthorizeRoute>
            <ReceitaForm />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/receitas-racao/editar/:id"
        element={
          <AuthorizeRoute>
            <ReceitaForm />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/fabrica/producao"
        element={
          <AuthorizeRoute>
            <ProducaoRacao />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/estoque/saida-racao"
        element={
          <AuthorizeRoute>
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
