import { useMemo, useEffect } from 'react'
import useAppStore from '@/stores/useAppStore'
import { toast } from '@/hooks/use-toast'

export interface AlertItem {
  id: string
  title: string
  description: string
  type: 'critical' | 'warning'
  date: string
  link?: string
  smsTriggered?: boolean
}

export function useAlerts() {
  const { state, dispatch } = useAppStore()

  const alerts = useMemo(() => {
    if (!state.isAuthenticated) return []
    const newAlerts: AlertItem[] = []

    // Maquinario Alerts
    state.maquinario.forEach((m) => {
      if (m.horimetro >= m.nextRevision) {
        newAlerts.push({
          id: `maq-${m.id}-${m.horimetro}`,
          title: 'Revisão de Maquinário',
          description: `${m.name} atingiu a hora de revisão (${m.horimetro}h).`,
          type: 'critical',
          date: new Date().toISOString(),
          link: '/maquinario',
        })
      }
    })

    // Repro Alerts
    state.reproducoes.forEach((r) => {
      if (r.status === 'Prenhe') {
        const animal = state.animais.find((a) => a.id === r.animalId)
        const brinco = animal ? animal.brinco : 'Desconhecido'
        const diffDays = Math.ceil((new Date(r.dpp).getTime() - new Date().getTime()) / 86400000)

        if (diffDays <= 15) {
          newAlerts.push({
            id: `repro-red-${r.id}-${diffDays}`,
            title: 'Alerta Maternidade',
            description: `Matriz ${brinco} a ${Math.max(0, diffDays)} dias do parto. Mover p/ Maternidade.`,
            type: 'critical',
            date: new Date().toISOString(),
            link: '/nascimentos',
            smsTriggered: true,
          })
        }
      }
    })

    // Finance Alerts
    state.transacoes.forEach((t) => {
      if (t.status === 'Pendente' && t.due_date) {
        const isOverdue = new Date(t.due_date).getTime() < new Date().getTime()
        if (isOverdue) {
          newAlerts.push({
            id: `fin-overdue-${t.id}`,
            title: 'Transação Atrasada',
            description: `Pagamento pendente: ${t.description} (${t.costCenter})`,
            type: 'critical',
            date: new Date().toISOString(),
            link: '/transacoes',
            smsTriggered: true,
          })
        }
      }
    })

    return newAlerts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [state.isAuthenticated, state.maquinario, state.reproducoes, state.animais, state.transacoes])

  useEffect(() => {
    if (alerts.length > 0 && state.isAuthenticated) {
      const unnotified = alerts.filter((a) => !state.notifiedAlertIds.includes(a.id))
      if (unnotified.length > 0) {
        unnotified.forEach((a) => {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(a.title, { body: a.description })
          }
          if (a.smsTriggered) {
            toast({
              title: '📱 Alerta SMS/WhatsApp Enviado',
              description: `Aviso enviado para a equipe: ${a.title}`,
              className: 'border-l-4 border-l-rose-500',
            })
          }
        })
        dispatch((s) => ({
          ...s,
          notifiedAlertIds: [...s.notifiedAlertIds, ...unnotified.map((a) => a.id)],
        }))
      }
    }
  }, [alerts, state.isAuthenticated, state.notifiedAlertIds, dispatch])

  return alerts
}
