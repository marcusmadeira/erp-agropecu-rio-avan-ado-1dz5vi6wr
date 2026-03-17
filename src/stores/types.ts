export type Role = 1 | 2 | 3

export interface Pasto {
  id: string
  name: string
  status: 'Livre' | 'Ocupado' | 'Em Descanso'
  loteId?: string
  grassHeight: number
  capacity: number
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
}
export interface Manejo {
  id: string
  type: string
  details: string
  date: string
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

export interface AppState {
  userRole: Role
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
}
