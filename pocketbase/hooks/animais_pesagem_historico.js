routerAdd(
  'GET',
  '/backend/v1/animais/{id}/pesagens',
  (e) => {
    const id = e.request.pathValue('id')
    const records = $app.findRecordsByFilter(
      'pesagens_diarias',
      'animal_id = {:id}',
      '-data_pesagem',
      1000,
      0,
      { id: id },
    )

    $apis.enrichRecords(e, records, 'animal_id')
    return e.json(200, records)
  },
  $apis.requireAuth(),
)
