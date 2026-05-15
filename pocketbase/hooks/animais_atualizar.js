routerAdd(
  'PATCH',
  '/backend/v1/animais/atualizar/{id}',
  (e) => {
    const id = e.request.pathValue('id')
    const body = e.requestInfo().body

    const record = $app.findRecordById('animais', id)
    const oldLoteId = record.getString('lote_atual_id')
    const oldPastoId = record.getString('piquete_atual_id')

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

    const newPastoId = record.getString('piquete_atual_id')
    if (oldPastoId !== newPastoId) {
      if (oldPastoId) {
        try {
          const oldPasto = $app.findRecordById('pastos_e_piquetes', oldPastoId)
          oldPasto.set('taxa_lotacao_atual', Math.max(0, oldPasto.getInt('taxa_lotacao_atual') - 1))
          $app.save(oldPasto)
        } catch (_) {}
      }
      if (newPastoId) {
        try {
          const newPasto = $app.findRecordById('pastos_e_piquetes', newPastoId)
          newPasto.set('taxa_lotacao_atual', newPasto.getInt('taxa_lotacao_atual') + 1)
          $app.save(newPasto)
        } catch (_) {}
      }
    }

    $apis.enrichRecord(e, record, 'lote_atual_id', 'piquete_atual_id', 'pai_id', 'mae_id')
    return e.json(200, record)
  },
  $apis.requireAuth(),
)
