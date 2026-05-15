import { AppState, User } from './types'

export const mockUsers: User[] = []

export const initialData: AppState = {
  isAuthenticated: false,
  currentUser: null,
  notifiedAlertIds: [],
  userRole: 1,
  isOnline: true,
  pendingSyncQueue: [],
  lastSync: new Date().toISOString(),
  users: [],
  pastos: [],
  lotes: [],
  animais: [],
  pesagens: [],
  reproducoes: [],
  estoque: [],
  formulacoes: [],
  producoesRacao: [],
  manejos: [],
  parceiros: [],
  transacoes: [],
  maquinario: [],
  clima: [],
  auditLogs: [],
  inttegraConfig: {
    token: '',
    baseUrl: 'https://api.inttegra.com/v1/',
    status: 'Desconectado',
    lastSync: null,
  },
  syncMappings: [],
  importLogs: [],
}
