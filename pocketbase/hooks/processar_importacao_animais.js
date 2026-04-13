routerAdd(
  'POST',
  '/backend/v1/processar-importacao-animais',
  (e) => {
    const body = e.requestInfo().body
    const registros = body.registros || []
    const origem = body.origem || 'CSV'

    let successCount = 0
    let errorCount = 0
    let errors = []

    const authId = e.auth?.id

    $app.runInTransaction((txApp) => {
      const col = txApp.findCollectionByNameOrId('animais')

      for (let i = 0; i < registros.length; i++) {
        const row = registros[i]
        const brinco = (row.id_manejo_brinco || '').toString().trim()

        if (!brinco) {
          errorCount++
          errors.push(`Linha ${i + 1}: Brinco ausente.`)
          continue
        }

        try {
          let existing = null
          try {
            existing = txApp.findFirstRecordByData('animais', 'id_manejo_brinco', brinco)
          } catch (_) {}

          if (existing) {
            errorCount++
            errors.push(`Linha ${i + 1}: Brinco '${brinco}' já cadastrado.`)
            continue
          }

          const record = new Record(col)
          record.set('id_manejo_brinco', brinco)
          record.set('rgd_rgn_abcz', (row.rgd_rgn_abcz || '').toString().trim())
          record.set('categoria', (row.categoria || 'Bezerro').toString().trim())
          record.set('status', (row.status_animal || row.status || 'Ativo').toString().trim())
          record.set('peso_atual_kg', parseFloat(row.peso_atual_kg) || 0)
          record.set('genealogia_pai', (row.genealogia_pai || '').toString().trim())
          record.set('genealogia_mae', (row.genealogia_mae || '').toString().trim())
          record.set('custo_variavel_acumulado', parseFloat(row.custo_variavel_acumulado) || 0)

          if (row.lote_atual_id) {
            record.set('lote_atual_id', row.lote_atual_id)
          }

          record.set('data_importacao', new Date().toISOString())
          record.set('origem_importacao', origem)

          txApp.save(record)
          successCount++
        } catch (err) {
          errorCount++
          errors.push(`Linha ${i + 1}: Erro ao salvar brinco '${brinco}' - ${err.message}`)
        }
      }

      if (successCount > 0) {
        try {
          const histCol = txApp.findCollectionByNameOrId('historico_importacoes')
          const histRec = new Record(histCol)
          histRec.set('usuario_id', authId)
          histRec.set('arquivo_nome', `Importacao_${origem}_${new Date().getTime()}`)
          histRec.set('quantidade', successCount)
          histRec.set('status', errorCount === 0 ? 'Sucesso' : 'Parcial')
          histRec.set('tipo_de_dado', 'animais')
          txApp.save(histRec)
        } catch (e) {
          console.log('Failed to save history:', e)
        }
      }
    })

    return e.json(200, { successCount, errorCount, errors })
  },
  $apis.requireAuth(),
)
