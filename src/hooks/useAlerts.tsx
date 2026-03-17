import { useMemo, useEffect } from 'react'
import useAppStore from '@/stores/useAppStore'

export interface AlertItem {
  id: string
  title: string
  description: string
  type: 'critical' | 'warning'
  date: string
  link?: string
}

export function useAlerts() {
  const { state, dispatch } = useAppStore()

  const alerts = useMemo(() => {
    if (!state.isAuthenticated) return []
    const newAlerts: AlertItem[] = []

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

    state.reproducoes.forEach((r) => {
      if (r.status === 'Prenhe') {
        const animal = state.animais.find((a) => a.id === r.animalId)
        const brinco = animal ? animal.brinco : 'Desconhecido'

        const dppDate = new Date(r.dpp)
        const diffTime = dppDate.getTime() - new Date().getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays <= 15) {
          const desc =
            diffDays < 0
              ? `Matriz ${brinco} com parto atrasado (${Math.abs(diffDays)} dias).`
              : `Matriz ${brinco} a ${diffDays} dias do parto. Mover p/ Maternidade.`

          newAlerts.push({
            id: `repro-red-${r.id}-${diffDays}`,
            title: 'Alerta Crítico Maternidade',
            description: desc,
            type: 'critical',
            date: new Date().toISOString(),
            link: '/nascimentos',
          })
        } else if (diffDays <= 30) {
          newAlerts.push({
            id: `repro-yel-${r.id}-${diffDays}`,
            title: 'Alerta Maternidade',
            description: `Matriz ${brinco} a ${diffDays} dias do parto.`,
            type: 'warning',
            date: new Date().toISOString(),
            link: '/nascimentos',
          })
        }
      }
    })

    return newAlerts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [state.isAuthenticated, state.maquinario, state.reproducoes, state.animais])

  useEffect(() => {
    if (alerts.length > 0 && state.isAuthenticated) {
      const unnotified = alerts.filter((a) => !state.notifiedAlertIds.includes(a.id))
      if (unnotified.length > 0) {
        unnotified.forEach((a) => {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(a.title, { body: a.description })
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
