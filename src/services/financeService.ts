import pb from '@/lib/pocketbase/client'
import { parseISO, startOfDay, endOfDay, differenceInDays } from 'date-fns'

export const getConsolidatedFinancials = async (dateFrom?: string, dateTo?: string) => {
  const [transacoes, despesas, boletos, boletosPagar] = await Promise.all([
    pb
      .collection('transacoes_financeiras')
      .getFullList()
      .catch(() => []),
    pb
      .collection('despesas')
      .getFullList()
      .catch(() => []),
    pb
      .collection('boletos')
      .getFullList({
        expand:
          'venda_id,venda_id.cliente_id,parcela_id,parcela_id.venda_id,parcela_id.venda_id.cliente_id',
      })
      .catch(() => []),
    pb
      .collection('boletos_pagar')
      .getFullList({ expand: 'despesa_id' })
      .catch(() => []),
  ])

  let realizedRevenue = 0
  let pendingRevenue = 0
  let realizedExpenses = 0
  let pendingExpenses = 0
  let delinquency = 0

  const isDateInRange = (dateStr: string) => {
    if (!dateStr) return false
    const d = parseISO(dateStr)
    if (dateFrom && d < startOfDay(parseISO(dateFrom))) return false
    if (dateTo && d > endOfDay(parseISO(dateTo))) return false
    return true
  }

  const in30d = new Date()
  in30d.setDate(new Date().getDate() + 30)
  const today = new Date()

  let expected30d = 0
  const overdueList: any[] = []

  transacoes.forEach((t: any) => {
    if (dateFrom || dateTo) {
      if (!isDateInRange(t.data_vencimento || t.data_competencia)) return
    }
    const val = Number(t.valor_total) || 0
    if (t.tipo_movimento === 'Receita') {
      if (
        t.status_pagamento === 'Recebido' ||
        t.status_pagamento === 'Efetivado' ||
        t.status_pagamento === 'Realizado'
      )
        realizedRevenue += val
      else if (t.status_pagamento === 'Atrasado') delinquency += val
      else {
        pendingRevenue += val
        if (new Date(t.data_vencimento) <= in30d) expected30d += val
      }
    } else {
      if (
        t.status_pagamento === 'Pago' ||
        t.status_pagamento === 'Recebido' ||
        t.status_pagamento === 'Efetivado' ||
        t.status_pagamento === 'Realizado'
      ) {
        realizedExpenses += val
      } else {
        pendingExpenses += val
      }
    }
  })

  const processedDespesaIds = new Set()

  boletosPagar.forEach((bp: any) => {
    if (dateFrom || dateTo) {
      if (!isDateInRange(bp.data_vencimento)) return
    }
    const val = Number(bp.valor) || 0
    if (bp.status === 'Pago') {
      realizedExpenses += val
    } else {
      pendingExpenses += val
    }
    if (bp.despesa_id) processedDespesaIds.add(bp.despesa_id)
  })

  despesas.forEach((d: any) => {
    if (processedDespesaIds.has(d.id)) return
    if (dateFrom || dateTo) {
      if (!isDateInRange(d.data_despesa)) return
    }
    const val = Number(d.valor) || 0
    realizedExpenses += val
  })

  boletos.forEach((b: any) => {
    if (dateFrom || dateTo) {
      if (!isDateInRange(b.data_vencimento)) return
    }
    const val = Number(b.valor_boleto) || 0
    if (b.status_boleto === 'Pago') {
      realizedRevenue += val
    } else if (b.status_boleto === 'Atrasado' || b.status_boleto === 'Vencido') {
      delinquency += val

      const client =
        b.expand?.venda_id?.expand?.cliente_id ||
        b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id
      overdueList.push({
        id: b.id,
        boleto: b.numero_boleto || 'N/A',
        clienteNome: client?.nome_razao_social || 'Desconhecido',
        clientePhone: client?.contato_whatsapp || client?.contato_whatsapp_cobranca,
        vencimento: b.data_vencimento,
        diasAtraso: differenceInDays(today, new Date(b.data_vencimento)),
        valor: val,
      })
    } else if (b.status_boleto !== 'Cancelado') {
      pendingRevenue += val
      if (new Date(b.data_vencimento) <= in30d) expected30d += val
    }
  })

  const balance = realizedRevenue - realizedExpenses
  const margin = realizedRevenue > 0 ? (balance / realizedRevenue) * 100 : 0

  const allTransactions = [
    ...transacoes.map((t: any) => ({
      ...t,
      data_vencimento: t.data_vencimento || t.data_competencia,
    })),
    ...boletosPagar.map((bp: any) => ({
      id: bp.id,
      tipo_movimento: 'Despesa',
      valor_total: bp.valor,
      data_vencimento: bp.data_vencimento,
      classificacao_custo: bp.expand?.despesa_id?.classificacao_custo || 'FIXA',
      status: bp.status,
      expand: bp.expand,
    })),
    ...boletos.map((b: any) => ({
      id: b.id,
      tipo_movimento: 'Receita',
      valor_total: b.valor_boleto,
      data_vencimento: b.data_vencimento,
      status: b.status_boleto,
      expand: b.expand,
    })),
  ]

  return {
    realizedRevenue,
    realizedExpenses,
    pendingExpenses,
    balance,
    margin,
    pendingRevenue,
    delinquency,
    expected30d,
    overdueList: overdueList.sort((a, b) => b.diasAtraso - a.diasAtraso),
    pieData: [
      { name: 'Pago', value: realizedRevenue, color: '#16a34a' },
      { name: 'A Receber', value: pendingRevenue, color: '#eab308' },
      { name: 'Atrasado', value: delinquency, color: '#dc2626' },
    ].filter((d) => d.value > 0),
    allTransactions,
  }
}
