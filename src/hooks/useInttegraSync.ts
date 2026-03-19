import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'

export function useInttegraSync() {
  const { state, dispatch } = useAppStore()
  const { toast } = useToast()

  const formatPayload = (data: any) => {
    const payload = { ...data }
    for (const key in payload) {
      if (typeof payload[key] === 'number') {
        payload[key] = Number(payload[key].toFixed(2))
      } else if (payload[key] instanceof Date) {
        payload[key] = payload[key].toISOString()
      } else if (typeof payload[key] === 'string' && !isNaN(Date.parse(payload[key]))) {
        try {
          payload[key] = new Date(payload[key]).toISOString()
        } catch (e) {
          // keep original if fails
        }
      }
    }
    return payload
  }

  const pushRecord = async (localTable: string, localId: string, recordData: any) => {
    const isConnected = state.inttegraConfig.status === 'Conectado'
    const formattedPayload = formatPayload(recordData)

    dispatch((s) => {
      const existing = s.syncMappings.find((m) => m.localId === localId)
      if (!existing) {
        return {
          ...s,
          syncMappings: [
            {
              id: Math.random().toString(),
              localTable,
              localId,
              remoteId: '',
              status: isConnected ? 'Pendente_Envio' : 'Erro_Sync',
              errorLog: isConnected ? '' : 'Sem conexão configurada',
            },
            ...s.syncMappings,
          ],
        }
      }
      return s
    })

    if (!isConnected) return

    setTimeout(() => {
      const success = Math.random() > 0.1 // 90% success rate mock
      dispatch((s) => ({
        ...s,
        syncMappings: s.syncMappings.map((m) =>
          m.localId === localId
            ? {
                ...m,
                status: success ? 'Sincronizado' : 'Erro_Sync',
                remoteId: success && !m.remoteId ? `INT-${localId.substring(0, 5)}` : m.remoteId,
                errorLog: success ? '' : 'Timeout ou erro 500 na API Inttegra',
              }
            : m,
        ),
      }))
    }, 1000)
  }

  const testConnection = (token: string, url: string) => {
    dispatch((s) => ({
      ...s,
      inttegraConfig: { ...s.inttegraConfig, token, baseUrl: url, status: 'Sincronizando' },
    }))
    setTimeout(() => {
      const success = token.length > 5
      dispatch((s) => ({
        ...s,
        inttegraConfig: {
          ...s.inttegraConfig,
          status: success ? 'Conectado' : 'Falha',
          lastSync: success ? new Date().toISOString() : s.inttegraConfig.lastSync,
        },
      }))
      toast({
        title: success ? 'Conexão Estabelecida' : 'Falha na Conexão',
        description: success ? 'API Inttegra conectada com sucesso.' : 'Verifique seu token e URL.',
        variant: success ? 'default' : 'destructive',
      })
    }, 1500)
  }

  const importInitialData = () => {
    if (state.inttegraConfig.status !== 'Conectado') {
      toast({ title: 'Erro', description: 'Configure a API primeiro.', variant: 'destructive' })
      return
    }
    toast({ title: 'Importando Histórico', description: 'Buscando dados da API Inttegra...' })

    setTimeout(() => {
      const mockInttegraAnimals = [
        {
          id: 'INT-A99',
          brinco: 'INT01',
          pesoAtual: 400,
          loteId: state.lotes[0]?.id || '',
          categoria: 'Matriz',
          gmd: 0,
          status: 'Ativo',
          costCenter: 'CC01-PO',
          birthDate: new Date().toISOString(),
          gender: 'F',
        },
      ]

      dispatch((s) => {
        let newAnimals = [...s.animais]
        let newMappings = [...s.syncMappings]

        mockInttegraAnimals.forEach((ma) => {
          const exists = newMappings.find((m) => m.remoteId === ma.id)
          if (!exists) {
            const localId = Math.random().toString()
            newAnimals.push({ ...ma, id: localId } as any)
            newMappings.push({
              id: Math.random().toString(),
              localTable: 'Animais',
              localId,
              remoteId: ma.id,
              status: 'Sincronizado',
              errorLog: '',
            })
          }
        })

        return {
          ...s,
          animais: newAnimals,
          syncMappings: newMappings,
          inttegraConfig: { ...s.inttegraConfig, lastSync: new Date().toISOString() },
        }
      })
      toast({ title: 'Importação Concluída', description: 'Base sincronizada com sucesso.' })
    }, 2000)
  }

  const retryBatch = () => {
    const pendings = state.syncMappings.filter((m) => m.status !== 'Sincronizado')
    if (pendings.length === 0) {
      toast({ title: 'Tudo em dia', description: 'Não há registros pendentes para sincronizar.' })
      return
    }

    toast({
      title: 'Rotina Batch Iniciada',
      description: `Sincronizando ${pendings.length} registros...`,
    })

    setTimeout(() => {
      dispatch((s) => ({
        ...s,
        syncMappings: s.syncMappings.map((m) =>
          m.status !== 'Sincronizado'
            ? {
                ...m,
                status: 'Sincronizado',
                remoteId: m.remoteId || `INT-${m.localId.substring(0, 5)}`,
                errorLog: '',
              }
            : m,
        ),
        inttegraConfig: { ...s.inttegraConfig, lastSync: new Date().toISOString() },
      }))
      toast({ title: 'Batch Concluído', description: 'Todos os registros foram atualizados.' })
    }, 2500)
  }

  return { pushRecord, testConnection, importInitialData, retryBatch }
}
