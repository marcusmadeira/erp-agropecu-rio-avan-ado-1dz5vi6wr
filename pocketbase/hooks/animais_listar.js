routerAdd(
  'GET',
  '/backend/v1/animais/listar',
  (e) => {
    const query = e.requestInfo().query
    const categoria = query['categoria']
    const sexo = query['sexo']
    const status = query['status']
    const lote_id = query['lote_id']

    let filter = '1=1'
    const params = {}

    if (categoria && categoria !== 'all') {
      filter += ' && categoria = {:categoria}'
      params.categoria = categoria
    }
    if (sexo && sexo !== 'all') {
      filter += ' && sexo = {:sexo}'
      params.sexo = sexo
    }
    if (status && status !== 'all') {
      filter += ' && status = {:status}'
      params.status = status
    }
    if (lote_id && lote_id !== 'all') {
      filter += ' && lote_atual_id = {:lote_id}'
      params.lote_id = lote_id
    }

    const records = $app.findRecordsByFilter('animais', filter, '-created', 1000, 0, params)

    $apis.enrichRecords(e, records, 'lote_atual_id', 'pai_id', 'mae_id')
    return e.json(200, records)
  },
  $apis.requireAuth(),
)
