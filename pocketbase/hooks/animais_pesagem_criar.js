routerAdd(
  'POST',
  '/backend/v1/animais/pesagem',
  (e) => {
    const body = e.requestInfo().body
    if (!body.animal_id || !body.peso_kg || !body.data_pesagem) {
      throw new BadRequestError('Campos obrigatórios ausentes')
    }

    let pesagemRecord
    $app.runInTransaction((txApp) => {
      const colPesagens = txApp.findCollectionByNameOrId('pesagens_diarias')
      pesagemRecord = new Record(colPesagens)

      Object.keys(body).forEach((key) => {
        pesagemRecord.set(key, body[key])
      })
      txApp.save(pesagemRecord)

      const animalRecord = txApp.findRecordById('animais', body.animal_id)
      animalRecord.set('peso_atual_kg', body.peso_kg)
      txApp.save(animalRecord)
    })

    $apis.enrichRecord(e, pesagemRecord, 'animal_id')
    return e.json(200, pesagemRecord)
  },
  $apis.requireAuth(),
)
