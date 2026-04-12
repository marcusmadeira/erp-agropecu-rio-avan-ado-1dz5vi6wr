routerAdd(
  'GET',
  '/backend/v1/obter_kpis_saude',
  (e) => {
    const dataInicio = e.request.url.query().get('data_inicio')
    const dataFim = e.request.url.query().get('data_fim')

    let filterT = '1=1'
    if (dataInicio) filterT += ` && data_vencimento >= '${dataInicio}'`
    if (dataFim) filterT += ` && data_vencimento <= '${dataFim}'`
    const transacoes = $app.findRecordsByFilter('transacoes_financeiras', filterT, '', 0, 0)

    let totalRev = 0
    let totalCost = 0
    for (let i = 0; i < transacoes.length; i++) {
      const val = transacoes[i].get('valor_total') || 0
      if (transacoes[i].get('tipo_movimento') === 'Receita') totalRev += val
      else if (transacoes[i].get('tipo_movimento') === 'Despesa') totalCost += val
    }

    let filterD = '1=1'
    if (dataInicio) filterD += ` && data_despesa >= '${dataInicio}'`
    if (dataFim) filterD += ` && data_despesa <= '${dataFim}'`
    const despesas = $app.findRecordsByFilter('despesas', filterD, '', 0, 0)
    let totalDespesas = 0
    for (let i = 0; i < despesas.length; i++) {
      totalDespesas += despesas[i].get('valor') || 0
    }

    const margemLucro = totalRev > 0 ? ((totalRev - totalCost) / totalRev) * 100 : 0
    const roi = totalCost > 0 ? (totalRev - totalCost) / totalCost : 0

    const animais = $app.findRecordsByFilter(
      'animais',
      "status != 'Vendido' && status != 'Morto'",
      '',
      0,
      0,
    )
    let custoVariavelTotal = 0
    let pesoTotal = 0
    const totalAnimais = animais.length

    for (let i = 0; i < animais.length; i++) {
      custoVariavelTotal += animais[i].get('custo_variavel_acumulado') || 0
      pesoTotal += animais[i].get('peso_atual_kg') || 0
    }

    const totalArrobas = pesoTotal / 30
    const custoArroba = totalArrobas > 0 ? custoVariavelTotal / totalArrobas : 0

    const pastos = $app.findRecordsByFilter('pastos_e_piquetes', '1=1', '', 0, 0)
    let totalArea = 0
    for (let i = 0; i < pastos.length; i++) {
      totalArea += pastos[i].get('area_hectares') || 0
    }
    const lotacao = totalArea > 0 ? totalAnimais / totalArea : 0

    const iatf = $app.findRecordsByFilter(
      'manejo_iatf_curral',
      "resultado_dg = 'Prenhe' || resultado_dg = 'Vazia'",
      '',
      0,
      0,
    )
    let prenhes = 0
    for (let i = 0; i < iatf.length; i++) {
      if (iatf[i].get('resultado_dg') === 'Prenhe') prenhes++
    }
    const taxaPrenhez = iatf.length > 0 ? (prenhes / iatf.length) * 100 : 0

    const desembolsoCabeca = totalAnimais > 0 ? totalDespesas / totalAnimais : 0

    return e.json(200, {
      margemLucro,
      roi,
      custoArroba,
      lotacao,
      taxaPrenhez,
      desembolsoCabeca,
      totalAnimais,
    })
  },
  $apis.requireAuth(),
)
