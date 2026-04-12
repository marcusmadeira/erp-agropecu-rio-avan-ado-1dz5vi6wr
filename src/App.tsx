import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/stores/useAppStore'
import useAppStore from '@/stores/useAppStore'
import { AuthProvider, useAuth } from '@/hooks/use-auth'

import Layout from './components/Layout'
import { BackgroundSync } from './components/BackgroundSync'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import EmailConfirmation from './pages/EmailConfirmation'
import NotFound from './pages/NotFound'
import Dashboard from './pages/Dashboard'
import Desempenho from './pages/dashboard/Desempenho'
import Auditoria from './pages/admin/Auditoria'
import Importacao from './pages/admin/Importacao'
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
import MetasKPIs from './pages/estrategia/MetasKPIs'
import SimuladorCenarios from './pages/estrategia/SimuladorCenarios'

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

  const getRoleLevel = (role: string | number) => {
    if (typeof role === 'number') return role
    switch (role) {
      case 'Gerente':
        return 1
      case 'Financeiro':
        return 2
      case 'Operacional':
        return 3
      default:
        return 1
    }
  }

  const userRole = getRoleLevel(user.nivel_acesso || 1)
  if (!allowedRoles.includes(userRole)) {
    if (userRole === 2 || userRole === 3) return <Navigate to="/desempenho" replace />
    return <Navigate to="/" replace />
  }

  return <>{children}</>
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
    <Route
      path="/register"
      element={
        <PublicRoute>
          <Register />
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
      path="/confirmacao-email"
      element={
        <PublicRoute>
          <EmailConfirmation />
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
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <Dashboard />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/desempenho"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <Desempenho />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/auditoria"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <Auditoria />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/importacao"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
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
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <DespesasPagamentos />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/controle-recebimento"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <RecebimentoBoletos />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/vendas"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <GestaoVendas />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/vendas/nova"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <VendaForm />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/vendas/editar/:id"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <VendaForm />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/vendas/geral/:id"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <VendaDetalhes />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/vendas/eventos/:id"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <EventoDetalhes />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/clima"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <Clima />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/mercado"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <Mercado />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/diagnostico-inicial"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <DiagnosticoInicial />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/metas-kpis"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <MetasKPIs />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/simulador-cenarios"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <SimuladorCenarios />
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
