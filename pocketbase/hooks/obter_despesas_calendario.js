routerAdd(
  'GET',
  '/backend/v1/obter_despesas_calendario',
  (e) => {
    const dataInicio = e.request.url.query().get('data_inicio')
    const dataFim = e.request.url.query().get('data_fim')

    let filter = '1=1'
    if (dataInicio) filter += ` && data_despesa >= '${dataInicio}'`
    if (dataFim) filter += ` && data_despesa <= '${dataFim}'`

    const records = $app.findRecordsByFilter('despesas', filter, 'data_despesa', 0, 0)

    const result = []
    for (let i = 0; i < records.length; i++) {
      const r = records[i]
      result.push({
        id: r.id,
        data_despesa: r.get('data_despesa').toString(),
        valor: r.get('valor') || 0,
        tipo_despesa: r.get('tipo_despesa'),
        descricao: r.get('descricao'),
        classificacao_custo: r.get('classificacao_custo'),
      })
    }

    return e.json(200, result)
  },
  $apis.requireAuth(),
)
