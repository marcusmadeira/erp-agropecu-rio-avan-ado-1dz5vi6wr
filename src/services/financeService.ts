import pb from '@/lib/pocketbase/client'

export const getConsolidatedFinancials = async (data_inicio?: string, data_fim?: string) => {
  try {
    let filter = `1=1`
    if (data_inicio) filter += ` && data_vencimento >= '${data_inicio}'`
    if (data_fim) filter += ` && data_vencimento <= '${data_fim}'`

    const transacoes = await pb.collection('transacoes_financeiras').getFullList({ filter })

    const realizedRevenue = transacoes
      .filter((t) => t.tipo_movimento === 'Receita' && t.status_pagamento === 'Recebido')
      .reduce((acc, t) => acc + (t.valor_total || 0), 0)

    const realizedExpenses = transacoes
      .filter((t) => t.tipo_movimento === 'Despesa' && t.status_pagamento === 'Recebido')
      .reduce((acc, t) => acc + (t.valor_total || 0), 0)

    const pendingExpenses = transacoes
      .filter((t) => t.tipo_movimento === 'Despesa' && t.status_pagamento !== 'Recebido')
      .reduce((acc, t) => acc + (t.valor_total || 0), 0)

    const balance = realizedRevenue - realizedExpenses

    const boletosReceber = await pb.collection('boletos').getFullList({
      filter: `status_boleto != 'Cancelado'`,
      expand: 'parcela_id.venda_id.cliente_id',
    })

    const overdueList = boletosReceber
      .filter((b) => {
        if (b.status_boleto === 'Atrasado') return true
        if (
          b.status_boleto === 'Pendente' &&
          b.data_vencimento &&
          new Date(b.data_vencimento).getTime() < new Date().getTime()
        )
          return true
        return false
      })
      .map((b) => ({
        id: b.id,
        clienteNome:
          b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id?.nome_razao_social ||
          'Desconhecido',
        clientePhone:
          b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id?.contato_whatsapp || '',
        vencimento: b.data_vencimento,
        valor: b.valor_boleto || 0,
        diasAtraso: b.data_vencimento
          ? Math.floor(
              (new Date().getTime() - new Date(b.data_vencimento).getTime()) / (1000 * 3600 * 24),
            )
          : 0,
      }))

    const delinquency = overdueList.reduce((acc, b) => acc + b.valor, 0)

    const expected30d = boletosReceber
      .filter((b) => {
        if (b.status_boleto === 'Pendente' && b.data_vencimento) {
          const diff = new Date(b.data_vencimento).getTime() - new Date().getTime()
          return diff >= 0 && diff <= 30 * 24 * 3600 * 1000
        }
        return false
      })
      .reduce((acc, b) => acc + (b.valor_boleto || 0), 0)

    const allTransactions = transacoes.map((t) => ({
      id: t.id,
      data_vencimento: t.data_vencimento,
      valor_total: t.valor_total,
      tipo_movimento: t.tipo_movimento,
      status: t.status_pagamento,
      descricao: t.descricao_lancamento,
      classificacao_custo: t.classificacao_custo || 'FIXA',
    }))

    return {
      realizedRevenue,
      realizedExpenses,
      pendingExpenses,
      balance,
      margin:
        realizedRevenue > 0 ? ((realizedRevenue - realizedExpenses) / realizedRevenue) * 100 : 0,
      delinquency,
      expected30d,
      pieData: [
        {
          name: 'Pago',
          value: boletosReceber
            .filter((b) => b.status_boleto === 'Pago')
            .reduce((a, b) => a + (b.valor_boleto || 0), 0),
        },
        { name: 'Atrasado', value: delinquency },
        { name: 'Pendente', value: expected30d },
      ],
      overdueList,
      allTransactions,
    }
  } catch (error) {
    console.error('Error in getConsolidatedFinancials', error)
    return {
      realizedRevenue: 0,
      realizedExpenses: 0,
      pendingExpenses: 0,
      balance: 0,
      margin: 0,
      delinquency: 0,
      expected30d: 0,
      pieData: [],
      overdueList: [],
      allTransactions: [],
    }
  }
}
