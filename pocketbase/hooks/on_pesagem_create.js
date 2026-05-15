onRecordCreate((e) => {
  const record = e.record
  const peso = record.getFloat('peso_kg')
  const animalId = record.getString('animal_id')
  const dataPesagem = record.getString('data_pesagem')

  if (new Date(dataPesagem) > new Date()) {
    throw new BadRequestError('Data da pesagem não pode ser no futuro')
  }

  if (peso && animalId) {
    record.set('arrobas', peso / 15.0)
    try {
      const records = $app.findRecordsByFilter(
        'pesagens_diarias',
        'animal_id = {:animal} && data_pesagem < {:data}',
        '-data_pesagem',
        1,
        0,
        {
          animal: animalId,
          data: dataPesagem,
        },
      )
      if (records.length > 0) {
        const lastPesagem = records[0]
        const diffTime =
          new Date(dataPesagem).getTime() -
          new Date(lastPesagem.getString('data_pesagem')).getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        if (diffDays > 0) {
          record.set('gmd_calculado', (peso - lastPesagem.getFloat('peso_kg')) / diffDays)
        } else {
          record.set('gmd_calculado', 0)
        }
      } else {
        record.set('gmd_calculado', 0)
      }
    } catch (_) {
      record.set('gmd_calculado', 0)
    }
  }
  e.next()
}, 'pesagens_diarias')

onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const peso = record.getFloat('peso_kg')
  const arrobas = record.getFloat('arrobas')
  const animalId = record.getString('animal_id')

  if (animalId && peso) {
    try {
      let animalLoteId = null
      $app.runInTransaction((txApp) => {
        const animal = txApp.findRecordById('animais', animalId)
        animal.set('peso_atual_kg', peso)
        animal.set('arrobas_atuais', arrobas)
        txApp.save(animal)
        animalLoteId = animal.getString('lote_atual_id')
      })

      if (animalLoteId) {
        const animaisLote = $app.findRecordsByFilter(
          'animais',
          'lote_atual_id = {:lote} && status = "Ativo"',
          '',
          0,
          0,
          { lote: animalLoteId },
        )
        let totalPeso = 0
        let count = 0
        for (const a of animaisLote) {
          totalPeso += a.getFloat('peso_atual_kg')
          count++
        }
        if (count > 0) {
          const lote = $app.findRecordById('lotes', animalLoteId)
          lote.set('peso_medio_lote', totalPeso / count)
          $app.save(lote)
        }
      }
    } catch (err) {
      $app.logger().error('Error syncing animal peso: ' + err.message)
    }
  }
  e.next()
}, 'pesagens_diarias')
