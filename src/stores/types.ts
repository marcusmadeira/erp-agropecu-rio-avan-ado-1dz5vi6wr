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
export interface Transacao {
  id: string
  description: string
  value: number
  type: 'Receita' | 'Despesa'
  date: string
  costCenter: string
  status: 'Pago' | 'Pendente'
  due_date?: string
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
  transacoes: Transacao[]
  maquinario: Maquinario[]
  clima: ClimaLog[]
  auditLogs: AuditLog[]
  inttegraConfig: InttegraConfig
  syncMappings: SyncMapping[]
}
