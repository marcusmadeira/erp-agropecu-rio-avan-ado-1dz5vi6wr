export type Role = 1 | 2 | 3

export interface User {
  id: string
  email: string
  name: string
  role: Role
  phone?: string
  password?: string
}

export interface Pasto {
  id: string
  name: string
  status: 'Livre' | 'Ocupado' | 'Em Descanso'
  loteId?: string
  grassHeight: number
  capacity: number
  area: number
  taxaLotacao: number
  idealEntryHeight: number
  minExitHeight: number
}
export interface Lote {
  id: string
  name: string
  costCenter: 'CC01-PO' | 'CC02-TIP'
}
export interface Animal {
  id: string
  brinco: string
  rgn?: string
  loteId: string
  categoria: string
  pesoEntrada?: number
  pesoAtual: number
  gmd: number
  pai?: string
  mae?: string
  status: string
  birthDate: string
  costCenter: 'CC01-PO' | 'CC02-TIP'
  gender: 'M' | 'F'
}
export interface Pesagem {
  id: string
  animalId: string
  weight: number
  date: string
}
export interface Reproducao {
  id: string
  animalId: string
  type: 'IATF' | 'Monta'
  date: string
  previsaoToque: string
  dpp: string
  status: 'Aguardando Toque' | 'Prenhe' | 'Vazia' | 'Parida'
}
export interface EstoqueItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  unitCost: number
}
export interface Manejo {
  id: string
  type: string
  details: string
  date: string
  loteId?: string
  cost?: number
  itemId?: string
  quantity?: number
}
export interface ParceiroNegocio {
  id: string
  Nome_Razao_Social: string
  Tipo_Documento: 'CPF' | 'CNPJ'
  Numero_Documento: string
  Categoria_Parceiro: string[]
  Status: 'Ativo' | 'Inativo'
  ID_Inttegra?: string
}
export interface Transacao {
  id: string
  Descricao_Lancamento: string
  Valor_Total: number
  Tipo_Movimento: 'Receita' | 'Despesa'
  Data_Competencia: string
  Data_Vencimento: string
  Data_Efetivacao_Real?: string
  Centro_Custo_Direcionado:
    | 'CC01-Nelore PO'
    | 'CC02-Comercial TIP'
    | 'CC03-Estrutural/Rateio'
    | string
  Status_Pagamento: 'Pendente' | 'Atrasado' | 'Efetivado'
  Macroconta_Inttegra: string
  Categoria_Inttegra: string
  Subcategoria_Detalhe?: string
  Parceiro_Vinculado?: string
}
export interface Maquinario {
  id: string
  name: string
  horimetro: number
  nextRevision: number
}
export interface ClimaLog {
  id: string
  date: string
  pluviometria: number
}
export interface AuditLog {
  id: string
  date: string
  userName: string
  action: 'Create' | 'Update' | 'Delete'
  table: string
  recordId: string
  oldValue: string
  newValue: string
}

export interface SyncAction {
  id: string
  type: string
  payload: any
  timestamp: string
}

export interface InttegraConfig {
  token: string
  baseUrl: string
  status: 'Conectado' | 'Falha' | 'Sincronizando' | 'Desconectado'
  lastSync: string | null
}

export interface SyncMapping {
  id: string
  localTable: string
  localId: string
  remoteId: string
  status: 'Sincronizado' | 'Pendente_Envio' | 'Erro_Sync'
  errorLog: string
}

export interface ImportLog {
  id: string
  Data_Upload: string
  Usuario_Responsavel: string
  Tipo_de_Dado: string
  Arquivo_Upload: string
  Status_Importacao: 'Pendente' | 'Processando' | 'Concluído' | 'Com Erros'
  Total_Linhas_Processadas: number
  Relatorio_de_Erros: string
}

export interface AppState {
  isAuthenticated: boolean
  currentUser: User | null
  notifiedAlertIds: string[]
  userRole: Role
  isOnline: boolean
  pendingSyncQueue: SyncAction[]
  lastSync: string | null
  users: User[]
  pastos: Pasto[]
  lotes: Lote[]
  animais: Animal[]
  pesagens: Pesagem[]
  reproducoes: Reproducao[]
  estoque: EstoqueItem[]
  manejos: Manejo[]
  parceiros: ParceiroNegocio[]
  transacoes: Transacao[]
  maquinario: Maquinario[]
  clima: ClimaLog[]
  auditLogs: AuditLog[]
  inttegraConfig: InttegraConfig
  syncMappings: SyncMapping[]
  importLogs: ImportLog[]
}
