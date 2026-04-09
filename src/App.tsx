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
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'
import Dashboard from './pages/Dashboard'
import Desempenho from './pages/dashboard/Desempenho'
import Auditoria from './pages/admin/Auditoria'
import Cadastros from './pages/Cadastros'
import Financeiro from './pages/Financeiro'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'
import AssistenteIA from './pages/AssistenteIA'
import Inttegra from './pages/admin/Inttegra'
import Integracoes from './pages/admin/Integracoes'
import Importacao from './pages/admin/Importacao'
import Pastos from './pages/estrutura/Pastos'
import Lotes from './pages/estrutura/Lotes'
import Animais from './pages/rebanho/Animais'
import Pesagem from './pages/rebanho/Pesagem'
import CurralDigital from './pages/rebanho/CurralDigital'
import Reclassificacao from './pages/rebanho/Reclassificacao'
import Apartacao from './pages/rebanho/Apartacao'
import Reproducao from './pages/reproducao/Reproducao'
import Estoque from './pages/suprimentos/Estoque'
import Manejo from './pages/suprimentos/Manejo'
import PrevisaoDemanda from './pages/suprimentos/PrevisaoDemanda'
import FabricaRacao from './pages/suprimentos/FabricaRacao'
import Transacoes from './pages/financeiro/Transacoes'
import EventosComerciais from './pages/financeiro/EventosComerciais'
import Parceiros from './pages/financeiro/Parceiros'
import Maquinario from './pages/operacoes/Maquinario'
import Clima from './pages/operacoes/Clima'
import Notificacoes from './pages/Notificacoes'

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
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />

  const userRole = user.nivel_acesso || 1
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
    <Route
      path="/forgot-password"
      element={
        <PublicRoute>
          <ForgotPassword />
        </PublicRoute>
      }
    />
    <Route
      path="/reset-password"
      element={
        <PublicRoute>
          <ResetPassword />
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
          <AuthorizeRoute allowedRoles={[1]}>
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
          <AuthorizeRoute allowedRoles={[1]}>
            <Auditoria />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/cadastros"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <Cadastros />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/financeiro"
        element={
          <AuthorizeRoute allowedRoles={[1, 2]}>
            <Financeiro />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/relatorios"
        element={
          <AuthorizeRoute allowedRoles={[1, 2]}>
            <Relatorios />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <AuthorizeRoute allowedRoles={[1]}>
            <Configuracoes />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/assistente-ia"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <AssistenteIA />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/inttegra"
        element={
          <AuthorizeRoute allowedRoles={[1]}>
            <Inttegra />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/integracoes"
        element={
          <AuthorizeRoute allowedRoles={[1]}>
            <Integracoes />
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
        path="/pastos"
        element={
          <AuthorizeRoute allowedRoles={[1, 3]}>
            <Pastos />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/lotes"
        element={
          <AuthorizeRoute allowedRoles={[1, 3]}>
            <Lotes />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/animais"
        element={
          <AuthorizeRoute allowedRoles={[1, 3]}>
            <Animais />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/pesagem"
        element={
          <AuthorizeRoute allowedRoles={[1, 3]}>
            <Pesagem />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/reclassificacao"
        element={
          <AuthorizeRoute allowedRoles={[1, 3]}>
            <Reclassificacao />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/apartacao"
        element={
          <AuthorizeRoute allowedRoles={[1, 3]}>
            <Apartacao />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/reproducao"
        element={
          <AuthorizeRoute allowedRoles={[1, 3]}>
            <Reproducao />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/estoque"
        element={
          <AuthorizeRoute allowedRoles={[1]}>
            <Estoque />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/previsao-demanda"
        element={
          <AuthorizeRoute allowedRoles={[1]}>
            <PrevisaoDemanda />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/fabrica-racao"
        element={
          <AuthorizeRoute allowedRoles={[1]}>
            <FabricaRacao />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/manejo"
        element={
          <AuthorizeRoute allowedRoles={[1]}>
            <Manejo />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/transacoes"
        element={
          <AuthorizeRoute allowedRoles={[1, 2]}>
            <Transacoes />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/parceiros"
        element={
          <AuthorizeRoute allowedRoles={[1, 3]}>
            <Parceiros />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/eventos-comerciais"
        element={
          <AuthorizeRoute allowedRoles={[1, 2]}>
            <EventosComerciais />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/maquinario"
        element={
          <AuthorizeRoute allowedRoles={[1]}>
            <Maquinario />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/clima"
        element={
          <AuthorizeRoute allowedRoles={[1]}>
            <Clima />
          </AuthorizeRoute>
        }
      />
      <Route
        path="/notificacoes"
        element={
          <AuthorizeRoute allowedRoles={[1, 2, 3]}>
            <Notificacoes />
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
