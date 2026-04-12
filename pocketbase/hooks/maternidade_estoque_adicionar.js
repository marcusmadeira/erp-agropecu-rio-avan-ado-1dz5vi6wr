routerAdd(
  'POST',
  '/backend/v1/maternidade/estoque',
  (e) => {
    const body = e.requestInfo().body
    if (!body.registro_id) {
      throw new BadRequestError('registro_id é obrigatório')
    }

    let animalRecord
    $app.runInTransaction((txApp) => {
      const registro = txApp.findRecordById('registro_nascimento', body.registro_id)

      const animaisCol = txApp.findCollectionByNameOrId('animais')
      animalRecord = new Record(animaisCol)

      animalRecord.set('id_manejo_brinco', registro.get('numero_tatuagem'))
      animalRecord.set('nome', `Bezerro(a) ${registro.get('numero_tatuagem')}`)
      animalRecord.set('categoria', 'Bezerro')
      animalRecord.set('sexo', registro.get('sexo'))
      animalRecord.set('data_nascimento', registro.get('data_nascimento'))
      animalRecord.set('peso_atual_kg', registro.get('peso_nascer'))
      animalRecord.set('mae_id', registro.get('vaca_mae_id'))
      animalRecord.set('status', 'Ativo')
      animalRecord.set('rgd_rgn_abcz', registro.get('rgn_abcz'))

      txApp.save(animalRecord)

      registro.set('status_rgn', 'Pronto Estoque')
      txApp.save(registro)
    })

    return e.json(200, animalRecord)
  },
  $apis.requireAuth(),
)
