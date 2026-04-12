routerAdd(
  'DELETE',
  '/backend/v1/animais/deletar/{id}',
  (e) => {
    const id = e.request.pathValue('id')
    const record = $app.findRecordById('animais', id)

    record.set('status', 'Descartado')
    $app.save(record)

    return e.json(200, { message: 'Animal descartado com sucesso', record })
  },
  $apis.requireAuth(),
)
