import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/stores/useAppStore'
import useAppStore from '@/stores/useAppStore'

import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'
import Dashboard from './pages/Dashboard'
import NutricaoEficiencia from './pages/dashboard/NutricaoEficiencia'
import Auditoria from './pages/admin/Auditoria'
import Inttegra from './pages/admin/Inttegra'
import Importacao from './pages/admin/Importacao'
import Pastos from './pages/estrutura/Pastos'
import Lotes from './pages/estrutura/Lotes'
import Animais from './pages/rebanho/Animais'
import CurralDigital from './pages/rebanho/CurralDigital'
import Reclassificacao from './pages/rebanho/Reclassificacao'
import EventosRepro from './pages/reproducao/Eventos'
import Nascimentos from './pages/reproducao/Nascimentos'
import Estoque from './pages/suprimentos/Estoque'
import Manejo from './pages/suprimentos/Manejo'
import PrevisaoDemanda from './pages/suprimentos/PrevisaoDemanda'
import Transacoes from './pages/financeiro/Transacoes'
import EventosComerciais from './pages/financeiro/EventosComerciais'
import Maquinario from './pages/operacoes/Maquinario'
import Clima from './pages/operacoes/Clima'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAppStore()
  if (!state.isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAppStore()
  if (state.isAuthenticated) return <Navigate to="/" replace />
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
      <Route path="/" element={<Dashboard />} />
      <Route path="/nutricao" element={<NutricaoEficiencia />} />
      <Route path="/auditoria" element={<Auditoria />} />
      <Route path="/inttegra" element={<Inttegra />} />
      <Route path="/importacao" element={<Importacao />} />
      <Route path="/pastos" element={<Pastos />} />
      <Route path="/lotes" element={<Lotes />} />
      <Route path="/animais" element={<Animais />} />
      <Route path="/pesagem" element={<CurralDigital />} />
      <Route path="/reclassificacao" element={<Reclassificacao />} />
      <Route path="/eventos-repro" element={<EventosRepro />} />
      <Route path="/nascimentos" element={<Nascimentos />} />
      <Route path="/estoque" element={<Estoque />} />
      <Route path="/previsao-demanda" element={<PrevisaoDemanda />} />
      <Route path="/manejo" element={<Manejo />} />
      <Route path="/transacoes" element={<Transacoes />} />
      <Route path="/eventos-comerciais" element={<EventosComerciais />} />
      <Route path="/maquinario" element={<Maquinario />} />
      <Route path="/clima" element={<Clima />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
)

const App = () => (
  <AppProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </TooltipProvider>
    </BrowserRouter>
  </AppProvider>
)

export default App
