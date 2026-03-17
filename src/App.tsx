import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/stores/useAppStore'

import Layout from './components/Layout'
import NotFound from './pages/NotFound'
import Dashboard from './pages/Dashboard'
import Pastos from './pages/estrutura/Pastos'
import Lotes from './pages/estrutura/Lotes'
import Animais from './pages/rebanho/Animais'
import CurralDigital from './pages/rebanho/CurralDigital'
import Reclassificacao from './pages/rebanho/Reclassificacao'
import EventosRepro from './pages/reproducao/Eventos'
import Nascimentos from './pages/reproducao/Nascimentos'
import Estoque from './pages/suprimentos/Estoque'
import Manejo from './pages/suprimentos/Manejo'
import Transacoes from './pages/financeiro/Transacoes'
import EventosComerciais from './pages/financeiro/EventosComerciais'
import Maquinario from './pages/operacoes/Maquinario'
import Clima from './pages/operacoes/Clima'

const App = () => (
  <AppProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pastos" element={<Pastos />} />
            <Route path="/lotes" element={<Lotes />} />
            <Route path="/animais" element={<Animais />} />
            <Route path="/pesagem" element={<CurralDigital />} />
            <Route path="/reclassificacao" element={<Reclassificacao />} />
            <Route path="/eventos-repro" element={<EventosRepro />} />
            <Route path="/nascimentos" element={<Nascimentos />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/manejo" element={<Manejo />} />
            <Route path="/transacoes" element={<Transacoes />} />
            <Route path="/eventos-comerciais" element={<EventosComerciais />} />
            <Route path="/maquinario" element={<Maquinario />} />
            <Route path="/clima" element={<Clima />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AppProvider>
)

export default App
