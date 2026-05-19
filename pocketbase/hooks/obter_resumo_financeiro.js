routerAdd(
  'GET',
  '/backend/v1/obter_resumo_financeiro',
  (e) => {
    const query = e.requestInfo().query
    const start = query['data_inicio'] || null
    const end = query['data_fim'] || null

    let dateFilter = ''
    if (start && end) {
      dateFilter = `data_vencimento >= '${start} 00:00:00.000Z' && data_vencimento <= '${end} 23:59:59.999Z'`
    } else if (start) {
      dateFilter = `data_vencimento >= '${start} 00:00:00.000Z'`
    }

    // Despesas (transacoes_financeiras onde tipo_movimento = 'Despesa')
    let filterDespesas = "tipo_movimento = 'Despesa'"
    if (dateFilter) filterDespesas += ` && ${dateFilter}`
    const despesasRecords = $app.findRecordsByFilter(
      'transacoes_financeiras',
      filterDespesas,
      '',
      0,
      0,
    )
    let totalDespesas = 0
    for (const d of despesasRecords) {
      totalDespesas += d.get('valor_total') || 0
    }

    // Receitas (transacoes_financeiras tipo_movimento = 'Receita' AND status_pagamento = 'Recebido' ou 'Pago')
    // AND parcelas_venda where status_parcela = 'Paga'
    let filterReceitas =
      "tipo_movimento = 'Receita' && (status_pagamento = 'Recebido' || status_pagamento = 'Pago' || status_pagamento = 'Efetivado')"
    if (dateFilter) filterReceitas += ` && ${dateFilter}`
    const receitasTransacoes = $app.findRecordsByFilter(
      'transacoes_financeiras',
      filterReceitas,
      '',
      0,
      0,
    )
    let totalReceitasRealizadas = 0
    for (const r of receitasTransacoes) {
      totalReceitasRealizadas += r.get('valor_total') || 0
    }

    let filterParcelasPagas = "status_parcela = 'Paga'"
    if (dateFilter) filterParcelasPagas += ` && ${dateFilter}`
    const parcelasPagas = $app.findRecordsByFilter('parcelas_venda', filterParcelasPagas, '', 0, 0)
    for (const p of parcelasPagas) {
      totalReceitasRealizadas += p.get('valor_parcela') || 0
    }

    // Projected Revenue (parcelas_venda Pendente/Atrasada + transacoes Receita Pendentes)
    let filterReceitasPendentes =
      "tipo_movimento = 'Receita' && (status_pagamento = 'Pendente' || status_pagamento = 'Atrasado')"
    if (dateFilter) filterReceitasPendentes += ` && ${dateFilter}`
    const receitasPendentes = $app.findRecordsByFilter(
      'transacoes_financeiras',
      filterReceitasPendentes,
      '',
      0,
      0,
    )
    let totalReceitasPendentes = 0
    for (const r of receitasPendentes) {
      totalReceitasPendentes += r.get('valor_total') || 0
    }

    let filterParcelasPendentes = "(status_parcela = 'Pendente' || status_parcela = 'Atrasada')"
    if (dateFilter) filterParcelasPendentes += ` && ${dateFilter}`
    const parcelasPendentes = $app.findRecordsByFilter(
      'parcelas_venda',
      filterParcelasPendentes,
      '',
      0,
      0,
    )
    for (const p of parcelasPendentes) {
      totalReceitasPendentes += p.get('valor_parcela') || 0
    }

    const transacoesTimeline = []
    const allTrans = $app.findRecordsByFilter(
      'transacoes_financeiras',
      dateFilter || '1=1',
      '-data_vencimento',
      500,
      0,
    )
    for (const t of allTrans) {
      transacoesTimeline.push({
        data_vencimento: t.getString('data_vencimento'),
        valor_total: t.get('valor_total'),
        tipo_movimento: t.getString('tipo_movimento'),
        classificacao_custo: t.getString('classificacao_custo'),
      })
    }
    const allParcelas = $app.findRecordsByFilter(
      'parcelas_venda',
      dateFilter || '1=1',
      '-data_vencimento',
      500,
      0,
    )
    for (const p of allParcelas) {
      transacoesTimeline.push({
        data_vencimento: p.getString('data_vencimento'),
        valor_total: p.get('valor_parcela'),
        tipo_movimento: 'Receita',
        classificacao_custo: 'VARIÁVEL',
      })
    }

    return e.json(200, {
      receitas: totalReceitasRealizadas + totalReceitasPendentes,
      receitasRealizadas: totalReceitasRealizadas,
      receitasPendentes: totalReceitasPendentes,
      despesas: totalDespesas,
      saldo: totalReceitasRealizadas - totalDespesas,
      margem:
        totalReceitasRealizadas > 0
          ? ((totalReceitasRealizadas - totalDespesas) / totalReceitasRealizadas) * 100
          : 0,
      transacoes: transacoesTimeline,
    })
  },
  $apis.requireAuth(),
)
