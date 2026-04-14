onRecordCreateRequest((e) => {
  const body = e.requestInfo().body
  if (body.peso_kg) {
    body.arrobas = body.peso_kg / 15
    try {
      const records = $app.findRecordsByFilter(
        'pesagens_diarias',
        'animal_id = {:animal} && data_pesagem < {:data}',
        '-data_pesagem',
        1,
        0,
        {
          animal: body.animal_id,
          data: body.data_pesagem,
        },
      )
      if (records.length > 0) {
        const lastPesagem = records[0]
        const diffTime =
          new Date(body.data_pesagem).getTime() -
          new Date(lastPesagem.get('data_pesagem')).getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        if (diffDays > 0) {
          body.gmd_calculado = (body.peso_kg - lastPesagem.get('peso_kg')) / diffDays
        }
      }
    } catch (_) {}

    e.requestInfo().body = body
  }
  e.next()
}, 'pesagens_diarias')

onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const peso = record.get('peso_kg')
  const arrobas = record.get('arrobas')
  const animalId = record.get('animal_id')

  if (animalId && peso) {
    try {
      const animal = $app.findRecordById('animais', animalId)
      animal.set('peso_atual_kg', peso)
      if (arrobas) animal.set('arrobas_atuais', arrobas)
      $app.save(animal)
    } catch (_) {}
  }
  e.next()
}, 'pesagens_diarias')
