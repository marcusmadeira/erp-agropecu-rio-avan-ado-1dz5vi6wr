import pb from '@/lib/pocketbase/client'

export const getConsolidatedFinancials = async (data_inicio?: string, data_fim?: string) => {
  try {
    let filterReceitas = `status_venda != 'Cancelado'`
    if (data_inicio) filterReceitas += ` && data_venda >= '${data_inicio}'`
    if (data_fim) filterReceitas += ` && data_venda <= '${data_fim}'`

    const vendas = await pb.collection('vendas').getFullList({ filter: filterReceitas })
    const realizedRevenue = vendas.reduce((acc, v) => acc + (v.valor_total_venda || 0), 0)

    let filterDespesas = `1=1`
    if (data_inicio) filterDespesas += ` && data_vencimento >= '${data_inicio}'`
    if (data_fim) filterDespesas += ` && data_vencimento <= '${data_fim}'`

    const boletosPagar = await pb
      .collection('boletos_pagar')
      .getFullList({ filter: filterDespesas, expand: 'despesa_id,fornecedor_id' })

    const realizedExpenses = boletosPagar
      .filter((b) => b.status === 'Pago')
      .reduce((acc, b) => acc + (b.valor || 0), 0)
    const pendingExpenses = boletosPagar
      .filter((b) => ['Pendente', 'Atrasado'].includes(b.status))
      .reduce((acc, b) => acc + (b.valor || 0), 0)

    const balance = realizedRevenue - realizedExpenses

    let filterBoletosReceber = `status_boleto != 'Cancelado'`
    if (data_inicio) filterBoletosReceber += ` && data_vencimento >= '${data_inicio}'`
    if (data_fim) filterBoletosReceber += ` && data_vencimento <= '${data_fim}'`

    const boletosReceber = await pb
      .collection('boletos')
      .getFullList({ filter: filterBoletosReceber, expand: 'parcela_id.venda_id.cliente_id' })

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

    const allTransactions: any[] = []
    vendas.forEach((v) => {
      allTransactions.push({
        id: v.id,
        data_vencimento: v.data_venda,
        valor_total: v.valor_total_venda,
        tipo_movimento: 'Receita',
        descricao: `Venda ${v.tipo_gado || 'Geral'}`,
      })
    })
    boletosPagar.forEach((b) => {
      allTransactions.push({
        id: b.id,
        data_vencimento: b.data_vencimento,
        valor_total: b.valor,
        tipo_movimento: 'Despesa',
        status: b.status,
        descricao: b.expand?.despesa_id?.tipo_despesa || 'Despesa',
        classificacao_custo: b.expand?.despesa_id?.classificacao_custo || 'FIXA',
      })
    })

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
