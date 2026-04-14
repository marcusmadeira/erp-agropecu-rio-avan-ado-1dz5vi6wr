import {
  LayoutDashboard,
  TrendingUp,
  Activity,
  ShoppingCart,
  Banknote,
  DollarSign,
  Target,
  BarChart,
  LineChart,
  CloudSun,
  Upload,
  ShieldCheck,
} from 'lucide-react'

import { Users } from 'lucide-react'

export const navigationMenu = [
  {
    title: 'Geral',
    items: [
      { title: 'Dashboard Financeiro', url: '/', icon: LayoutDashboard, roles: [1, 2] },
      { title: 'Desempenho', url: '/desempenho', icon: TrendingUp, roles: [1, 2] },
    ],
  },
  {
    title: 'Rebanho',
    items: [{ title: 'Animais', url: '/animais', icon: Activity, roles: [1, 2, 3] }],
  },
  {
    title: 'Comercial & Financeiro',
    items: [
      { title: 'Vendas', url: '/vendas', icon: ShoppingCart, roles: [1, 2] },
      { title: 'Recebimento', url: '/controle-recebimento', icon: Banknote, roles: [1, 2] },
      { title: 'Despesas', url: '/despesas', icon: DollarSign, roles: [1, 2] },
    ],
  },
  {
    title: 'Gestão Estratégica',
    items: [
      { title: 'Diagnóstico', url: '/diagnostico-inicial', icon: Target, roles: [1, 2] },
      { title: 'Metas', url: '/metas-kpis', icon: BarChart, roles: [1, 2] },
      { title: 'Simulador', url: '/simulador-cenarios', icon: LineChart, roles: [1, 2] },
    ],
  },
  {
    title: 'Operações',
    items: [
      { title: 'Clima', url: '/clima', icon: CloudSun, roles: [1, 2, 3] },
      { title: 'Mercado', url: '/mercado', icon: TrendingUp, roles: [1, 2] },
    ],
  },
  {
    title: 'Administração',
    items: [
      { title: 'Importação', url: '/importacao', icon: Upload, roles: [1] },
      {
        title: 'Importar Fornecedores',
        url: '/importador-fornecedores',
        icon: Upload,
        roles: [1],
      },
      { title: 'Auditoria', url: '/auditoria', icon: ShieldCheck, roles: [1] },
      { title: 'Novo Usuário', url: '/usuarios/novo', icon: Users, roles: [1] },
    ],
  },
]
