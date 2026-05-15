routerAdd(
  'POST',
  '/backend/v1/animais/pesagem-lote',
  (e) => {
    const body = e.requestInfo().body
    if (!body.lote_id || !body.data_pesagem || !body.peso_medio_kg) {
      throw new BadRequestError('lote_id, data_pesagem e peso_medio_kg são obrigatórios')
    }

    if (new Date(body.data_pesagem) > new Date()) {
      throw new BadRequestError('Data da pesagem não pode ser no futuro')
    }

    let animais = []
    try {
      animais = $app.findRecordsByFilter(
        'animais',
        'lote_atual_id = {:lote} && status = "Ativo"',
        '',
        0,
        0,
        { lote: body.lote_id },
      )
    } catch (_) {}

    if (animais.length === 0) {
      throw new BadRequestError('Nenhum animal ativo encontrado neste lote')
    }

    $app.runInTransaction((txApp) => {
      const pesagensCol = txApp.findCollectionByNameOrId('pesagens_diarias')

      for (const animal of animais) {
        const p = new Record(pesagensCol)
        p.set('animal_id', animal.id)
        p.set('data_pesagem', body.data_pesagem)
        p.set('peso_kg', body.peso_medio_kg)
        if (body.responsavel_pesagem) p.set('responsavel_pesagem', body.responsavel_pesagem)
        p.set('observacoes', body.observacoes || 'Pesagem em Lote')

        txApp.save(p)
      }
    })

    return e.json(200, { success: true, animais_pesados: animais.length })
  },
  $apis.requireAuth(),
)
