routerAdd(
  'PATCH',
  '/backend/v1/animais/atualizar/{id}',
  (e) => {
    const id = e.request.pathValue('id')
    const body = e.requestInfo().body

    const record = $app.findRecordById('animais', id)

    Object.keys(body).forEach((key) => {
      if (key !== 'id' && key !== 'created' && key !== 'updated') {
        record.set(key, body[key])
      }
    })

    $app.save(record)
    $apis.enrichRecord(e, record, 'lote_atual_id', 'pai_id', 'mae_id')
    return e.json(200, record)
  },
  $apis.requireAuth(),
)
