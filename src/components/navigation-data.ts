import {
  HeartPulse,
  Scale,
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
  FileText,
  PackagePlus,
  PackageMinus,
  ClipboardList,
  Factory,
  ArrowRightLeft,
  Users,
  Thermometer,
  Map,
} from 'lucide-react'

export const navigationMenu = [
  {
    title: 'Geral',
    items: [
      { title: 'Dashboard Financeiro', url: '/', icon: LayoutDashboard, roles: [1, 2] },
      { title: 'Desempenho', url: '/desempenho', icon: TrendingUp, roles: [1, 2] },
    ],
  },
  {
    title: 'Gestão de Rebanho',
    items: [
      { title: 'Gestão de Lotes', url: '/lotes', icon: PackagePlus, roles: [1, 2, 3] },
      { title: 'Pastagens', url: '/pastos', icon: Map, roles: [1, 2, 3] },
      { title: 'Animais', url: '/animais', icon: Activity, roles: [1, 2, 3] },
      { title: 'Apartação Dinâmica', url: '/apartacao', icon: ArrowRightLeft, roles: [1, 2, 3] },
      { title: 'Reprodução & Monta', url: '/reproducao', icon: HeartPulse, roles: [1, 2, 3] },
      {
        title: 'Estoque de Sêmen',
        url: '/reproducao#estoque',
        icon: Thermometer,
        roles: [1, 2, 3],
      },
      { title: 'Pesagem', url: '/pesagem', icon: Scale, roles: [1, 2, 3] },
      { title: 'Inventário Geral', url: '/inventario', icon: ClipboardList, roles: [1, 2] },
      { title: 'Estoque e Valor', url: '/estoque-rebanho', icon: DollarSign, roles: [1, 2] },
    ],
  },
  {
    title: 'Comercial & Financeiro',
    items: [
      { title: 'Vendas', url: '/vendas/geral', icon: ShoppingCart, roles: [1, 2] },
      { title: 'Recebimento', url: '/controle-recebimento', icon: Banknote, roles: [1, 2] },
      { title: 'Painel de Cobrança', url: '/painel-cobranca', icon: Banknote, roles: [1, 2] },
      { title: 'Despesas', url: '/despesas', icon: DollarSign, roles: [1, 2] },
    ],
  },
  {
    title: 'Gestão Estratégica',
    items: [
      { title: 'Diagnóstico', url: '/diagnostico-inicial', icon: Target, roles: [1, 2] },
      { title: 'Ponto Ótimo de Venda', url: '/ponto-otimo', icon: Target, roles: [1, 2] },
      { title: 'Metas', url: '/metas-kpis', icon: BarChart, roles: [1, 2] },
      { title: 'Simulador', url: '/simulador-cenarios', icon: LineChart, roles: [1, 2] },
      { title: 'Fechamento de Lotes', url: '/fechamento-lotes', icon: FileText, roles: [1, 2] },
    ],
  },
  {
    title: 'Operações',
    items: [
      { title: 'Clima', url: '/clima', icon: CloudSun, roles: [1, 2, 3] },
      { title: 'Mercado', url: '/mercado', icon: TrendingUp, roles: [1, 2, 3] },
    ],
  },
  {
    title: 'Estoque',
    items: [
      { title: 'Dashboard', url: '/estoque/dashboard', icon: LayoutDashboard, roles: [1, 2] },
      {
        title: 'Planejamento de Compras',
        url: '/estoque/planejamento-compras',
        icon: ShoppingCart,
        roles: [1, 2],
      },
      {
        title: 'Cadastro Manual',
        url: '/estoque/cadastro-manual',
        icon: PackagePlus,
        roles: [1, 2],
      },
      { title: 'Receitas de Ração', url: '/receitas-racao', icon: ClipboardList, roles: [1, 2, 3] },
      { title: 'Produção de Ração', url: '/fabrica/producao', icon: Factory, roles: [1, 2, 3] },
      {
        title: 'Saída de Ração',
        url: '/estoque/saida-racao',
        icon: PackageMinus,
        roles: [1, 2, 3],
      },
    ],
  },
  {
    title: 'Administração',
    items: [
      { title: 'Importação', url: '/importacao', icon: Upload, roles: [1, 2] },
      {
        title: 'Importar Fornecedores',
        url: '/importador-fornecedores',
        icon: Upload,
        roles: [1, 2],
      },
      { title: 'Importar Notas (OCR)', url: '/importador-notas', icon: FileText, roles: [1, 2] },
      { title: 'Auditoria', url: '/auditoria', icon: ShieldCheck, roles: [1, 2] },
      { title: 'Sanitização Técnica', url: '/sanitizacao', icon: FileText, roles: [1] },
      { title: 'Setup Inicial', url: '/admin/setup-inicial', icon: PackagePlus, roles: [1, 2] },
      { title: 'Novo Usuário', url: '/usuarios/novo', icon: Users, roles: [1, 2] },
    ],
  },
]
