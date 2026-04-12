routerAdd(
  'GET',
  '/backend/v1/vendas',
  (e) => {
    let filter = '1=1'
    const query = e.requestInfo().query

    const dataVenda = query['data_venda']
    const statusVenda = query['status_venda']
    const clienteId = query['cliente_id']
    const tipoGado = query['tipo_gado']

    if (dataVenda) filter += ` && data_venda >= '${dataVenda}'`
    if (statusVenda) filter += ` && status_venda = '${statusVenda}'`
    if (clienteId) filter += ` && cliente_id = '${clienteId}'`
    if (tipoGado) filter += ` && tipo_gado = '${tipoGado}'`

    const records = $app.findRecordsByFilter('vendas', filter, '-data_venda', 100, 0)
    $apis.enrichRecords(e, records, 'cliente_id', 'evento_id')
    return e.json(200, records)
  },
  $apis.requireAuth(),
)
