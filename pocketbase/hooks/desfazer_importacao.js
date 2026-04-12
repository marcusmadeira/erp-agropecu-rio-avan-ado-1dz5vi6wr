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
    const tipo_dado = histRecord.get('tipo_de_dado') || 'animais'

    let collectionName = 'animais'
    if (tipo_dado === 'parceiros') collectionName = 'parceiros_negocios'
    if (tipo_dado === 'transacoes') collectionName = 'transacoes_financeiras'

    try {
      $app.runInTransaction((txApp) => {
        for (const recordId of registros_ids) {
          try {
            const record = txApp.findRecordById(collectionName, recordId)
            txApp.delete(record)
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
