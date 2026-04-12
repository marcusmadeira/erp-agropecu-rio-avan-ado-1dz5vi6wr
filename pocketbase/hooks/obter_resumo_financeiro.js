routerAdd(
  'GET',
  '/backend/v1/obter_resumo_financeiro',
  (e) => {
    const dataInicio = e.request.url.query().get('data_inicio')
    const dataFim = e.request.url.query().get('data_fim')

    let filter = '1=1'
    if (dataInicio) filter += ` && data_vencimento >= '${dataInicio}'`
    if (dataFim) filter += ` && data_vencimento <= '${dataFim}'`

    const records = $app.findRecordsByFilter(
      'transacoes_financeiras',
      filter,
      '-data_vencimento',
      0,
      0,
    )

    let receitas = 0
    let despesas = 0
    const transacoes = []

    for (let i = 0; i < records.length; i++) {
      const t = records[i]
      const val = t.get('valor_total') || 0
      const tipo = t.get('tipo_movimento')

      if (tipo === 'Receita') {
        receitas += val
      } else if (tipo === 'Despesa') {
        despesas += val
      }

      transacoes.push({
        id: t.id,
        data_vencimento: t.get('data_vencimento').toString(),
        tipo_movimento: tipo,
        classificacao_custo: t.get('classificacao_custo'),
        valor_total: val,
      })
    }

    const saldo = receitas - despesas
    const margem = receitas > 0 ? (saldo / receitas) * 100 : 0

    return e.json(200, {
      receitas,
      despesas,
      saldo,
      margem,
      transacoes,
    })
  },
  $apis.requireAuth(),
)
