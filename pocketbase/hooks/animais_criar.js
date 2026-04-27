routerAdd(
  'POST',
  '/backend/v1/animais/criar',
  (e) => {
    const body = e.requestInfo().body

    if (!body.id_manejo_brinco || !body.categoria || !body.sexo) {
      throw new BadRequestError('Campos obrigatórios ausentes: id_manejo_brinco, categoria, sexo')
    }

    const collection = $app.findCollectionByNameOrId('animais')
    const record = new Record(collection)

    Object.keys(body).forEach((key) => {
      if (key !== 'id' && key !== 'created' && key !== 'updated') {
        record.set(key, body[key])
      }
    })

    $app.save(record)

    const loteId = record.getString('lote_atual_id')
    if (loteId) {
      try {
        const lote = $app.findRecordById('lotes', loteId)
        lote.set('quantidade_cabecas', lote.getInt('quantidade_cabecas') + 1)
        $app.save(lote)
      } catch (_) {}
    }

    $apis.enrichRecord(e, record, 'lote_atual_id', 'pai_id', 'mae_id')
    return e.json(200, record)
  },
  $apis.requireAuth(),
)
