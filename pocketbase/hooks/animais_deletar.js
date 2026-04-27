routerAdd(
  'DELETE',
  '/backend/v1/animais/deletar/{id}',
  (e) => {
    const id = e.request.pathValue('id')
    const record = $app.findRecordById('animais', id)

    const oldLoteId = record.getString('lote_atual_id')

    record.set('status', 'Descartado')
    record.set('lote_atual_id', '') // Clear the lot to officially remove it
    $app.save(record)

    if (oldLoteId) {
      try {
        const oldLote = $app.findRecordById('lotes', oldLoteId)
        oldLote.set('quantidade_cabecas', Math.max(0, oldLote.getInt('quantidade_cabecas') - 1))
        $app.save(oldLote)
      } catch (_) {}
    }

    return e.json(200, { message: 'Animal descartado com sucesso', record })
  },
  $apis.requireAuth(),
)
