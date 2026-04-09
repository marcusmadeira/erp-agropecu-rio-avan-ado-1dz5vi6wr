routerAdd(
  'POST',
  '/backend/v1/importar-animais',
  (e) => {
    const body = e.requestInfo().body
    const registros = body.registros || []
    const arquivo_nome = body.arquivo_nome || 'arquivo_desconhecido'
    const usuario_id = e.auth?.id

    if (!usuario_id) {
      throw new UnauthorizedError('Usuário não autenticado')
    }

    if (registros.length === 0) {
      throw new BadRequestError('Nenhum registro para importar.')
    }

    let inseridos = []

    try {
      $app.runInTransaction((txApp) => {
        const animaisCollection = txApp.findCollectionByNameOrId('animais')

        for (const reg of registros) {
          try {
            txApp.findFirstRecordByData('animais', 'id_manejo_brinco', reg.brinco)
            throw new Error(`Brinco ${reg.brinco} já cadastrado no sistema.`)
          } catch (err) {
            if (err.message.includes('já cadastrado')) throw err
          }

          const record = new Record(animaisCollection)
          record.set('id_manejo_brinco', reg.brinco)
          record.set('nome', reg.nome)
          if (reg.rgd) record.set('rgd_rgn_abcz', reg.rgd)
          record.set('categoria', reg.categoria)
          if (reg.data_nascimento) record.set('data_nascimento', reg.data_nascimento)
          record.set('peso_atual_kg', reg.peso)
          record.set('lote_atual', reg.lote_id)
          if (reg.pai_id) record.set('pai_id', reg.pai_id)
          if (reg.mae_id) record.set('mae_id', reg.mae_id)
          record.set('status', 'Ativo')

          txApp.save(record)
          inseridos.push(record.id)
        }

        const histCollection = txApp.findCollectionByNameOrId('historico_importacoes')
        const histRecord = new Record(histCollection)
        histRecord.set('usuario_id', usuario_id)
        histRecord.set('arquivo_nome', arquivo_nome)
        histRecord.set('quantidade', inseridos.length)
        histRecord.set('status', 'Sucesso')
        histRecord.set('registros_ids', inseridos)
        txApp.save(histRecord)
      })
    } catch (err) {
      const histCollection = $app.findCollectionByNameOrId('historico_importacoes')
      const histRecord = new Record(histCollection)
      histRecord.set('usuario_id', usuario_id)
      histRecord.set('arquivo_nome', arquivo_nome)
      histRecord.set('quantidade', 0)
      histRecord.set('status', 'Falha')
      histRecord.set('registros_ids', [])
      $app.save(histRecord)

      throw new BadRequestError(`Falha na importação: ${err.message}`)
    }

    return e.json(200, { success: true, quantidade: inseridos.length })
  },
  $apis.requireAuth(),
)
