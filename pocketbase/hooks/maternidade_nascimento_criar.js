routerAdd(
  'POST',
  '/backend/v1/maternidade/nascimento',
  (e) => {
    const body = e.requestInfo().body
    if (!body.vaca_mae_id || !body.data_nascimento || !body.numero_tatuagem) {
      throw new BadRequestError('Campos obrigatórios ausentes')
    }

    const collection = $app.findCollectionByNameOrId('registro_nascimento')
    const record = new Record(collection)

    record.set('vaca_mae_id', body.vaca_mae_id)
    record.set('data_nascimento', body.data_nascimento)
    if (body.sexo) record.set('sexo', body.sexo)
    if (body.peso_nascer) record.set('peso_nascer', body.peso_nascer)
    record.set('numero_tatuagem', body.numero_tatuagem)
    record.set('status_rgn', 'Aguardando RGN')

    $app.save(record)

    return e.json(200, record)
  },
  $apis.requireAuth(),
)
