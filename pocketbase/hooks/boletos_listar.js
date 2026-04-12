routerAdd(
  'GET',
  '/backend/v1/boletos',
  (e) => {
    let filter = '1=1'
    const query = e.requestInfo().query
    const status = query['status']

    if (status) filter += ` && status_boleto = '${status}'`

    const records = $app.findRecordsByFilter('boletos', filter, '-data_vencimento', 500, 0)
    $apis.enrichRecords(e, records, 'parcela_id.venda_id.cliente_id')
    return e.json(200, records)
  },
  $apis.requireAuth(),
)
