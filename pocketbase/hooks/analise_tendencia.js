routerAdd(
  'GET',
  '/backend/v1/analise-tendencia',
  (e) => {
    const records = $app.findRecordsByFilter(
      'precos_mercado',
      "data_registro != ''",
      '-data_registro',
      100,
      0,
    )

    let tendencia_arroba = 'Estável'
    let tendencia_milho = 'Estável'
    let tendencia_soja = 'Estável'

    let forecast_arroba = 0
    let forecast_milho = 0
    let forecast_soja = 0

    if (records.length > 1) {
      const current = records[0]
      const previous = records[1]

      const diff_arroba = current.get('preco_arroba') - previous.get('preco_arroba')
      if (diff_arroba > 2) tendencia_arroba = 'Tendência de Alta'
      else if (diff_arroba < -2) tendencia_arroba = 'Baixa'

      const diff_milho = current.get('preco_milho') - previous.get('preco_milho')
      if (diff_milho > 1) tendencia_milho = 'Tendência de Alta'
      else if (diff_milho < -1) tendencia_milho = 'Baixa'

      const diff_soja = current.get('preco_farelo_soja') - previous.get('preco_farelo_soja')
      if (diff_soja > 1) tendencia_soja = 'Tendência de Alta'
      else if (diff_soja < -1) tendencia_soja = 'Baixa'

      forecast_arroba = current.get('preco_arroba') + diff_arroba
      forecast_milho = current.get('preco_milho') + diff_milho
      forecast_soja = current.get('preco_farelo_soja') + diff_soja
    } else if (records.length === 1) {
      forecast_arroba = records[0].get('preco_arroba')
      forecast_milho = records[0].get('preco_milho')
      forecast_soja = records[0].get('preco_farelo_soja')
    }

    return e.json(200, {
      tendencias: {
        arroba: tendencia_arroba,
        milho: tendencia_milho,
        soja: tendencia_soja,
      },
      forecast: {
        arroba: forecast_arroba,
        milho: forecast_milho,
        soja: forecast_soja,
      },
      recommendations: {
        arroba: tendencia_arroba === 'Baixa' ? 'Segurar' : 'Vender',
        milho: tendencia_milho === 'Baixa' ? 'Comprar' : 'Segurar',
        soja: tendencia_soja === 'Baixa' ? 'Comprar' : 'Segurar',
      },
    })
  },
  $apis.requireAuth(),
)
