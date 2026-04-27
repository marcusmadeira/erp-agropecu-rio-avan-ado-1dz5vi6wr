routerAdd(
  'PATCH',
  '/backend/v1/animais/atualizar/{id}',
  (e) => {
    const id = e.request.pathValue('id')
    const body = e.requestInfo().body

    const record = $app.findRecordById('animais', id)
    const oldLoteId = record.getString('lote_atual_id')

    Object.keys(body).forEach((key) => {
      if (key !== 'id' && key !== 'created' && key !== 'updated') {
        record.set(key, body[key])
      }
    })

    $app.save(record)

    const newLoteId = record.getString('lote_atual_id')
    if (oldLoteId !== newLoteId) {
      if (oldLoteId) {
        try {
          const oldLote = $app.findRecordById('lotes', oldLoteId)
          oldLote.set('quantidade_cabecas', Math.max(0, oldLote.getInt('quantidade_cabecas') - 1))
          $app.save(oldLote)
        } catch (_) {}
      }
      if (newLoteId) {
        try {
          const newLote = $app.findRecordById('lotes', newLoteId)
          newLote.set('quantidade_cabecas', newLote.getInt('quantidade_cabecas') + 1)
          $app.save(newLote)
        } catch (_) {}
      }
    }

    $apis.enrichRecord(e, record, 'lote_atual_id', 'pai_id', 'mae_id')
    return e.json(200, record)
  },
  $apis.requireAuth(),
)
