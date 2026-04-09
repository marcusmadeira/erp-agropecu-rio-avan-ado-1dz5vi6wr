routerAdd(
  'POST',
  '/backend/v1/desfazer-importacao/{id}',
  (e) => {
    const id = e.request.pathValue('id')
    const usuario_id = e.auth?.id

    if (!usuario_id) {
      throw new UnauthorizedError('Usuário não autenticado')
    }

    const histRecord = $app.findRecordById('historico_importacoes', id)
    if (!histRecord) {
      throw new NotFoundError('Histórico não encontrado')
    }

    const created = new Date(histRecord.get('created'))
    const now = new Date()
    if (now.getTime() - created.getTime() > 24 * 60 * 60 * 1000) {
      throw new BadRequestError('O período de 24 horas para desfazer esta importação já expirou.')
    }

    const registros_ids = histRecord.get('registros_ids') || []

    try {
      $app.runInTransaction((txApp) => {
        for (const animalId of registros_ids) {
          try {
            const animal = txApp.findRecordById('animais', animalId)
            txApp.delete(animal)
          } catch (err) {}
        }
        txApp.delete(histRecord)
      })
    } catch (err) {
      throw new BadRequestError(`Falha ao desfazer: ${err.message}`)
    }

    return e.json(200, { success: true, message: 'Importação desfeita com sucesso.' })
  },
  $apis.requireAuth(),
)
