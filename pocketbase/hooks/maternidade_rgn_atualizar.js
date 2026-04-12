routerAdd(
  'PATCH',
  '/backend/v1/maternidade/rgn/{id}',
  (e) => {
    const id = e.request.pathValue('id')
    const body = e.requestInfo().body

    if (!body.rgn_abcz) {
      throw new BadRequestError('RGN ABCZ é obrigatório')
    }

    const record = $app.findRecordById('registro_nascimento', id)
    record.set('rgn_abcz', body.rgn_abcz)
    record.set('status_rgn', 'RGN Recebido')

    $app.save(record)
    return e.json(200, record)
  },
  $apis.requireAuth(),
)
