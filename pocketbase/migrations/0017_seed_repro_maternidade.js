migrate(
  (app) => {
    const animaisCol = app.findCollectionByNameOrId('animais')

    let matriz1, matriz2, touro1, touro2

    try {
      matriz1 = app.findFirstRecordByFilter('animais', "categoria = 'Matriz PO'")
    } catch (_) {
      matriz1 = new Record(animaisCol)
      matriz1.set('id_manejo_brinco', 'M001')
      matriz1.set('categoria', 'Matriz PO')
      app.save(matriz1)
    }

    try {
      matriz2 = app.findFirstRecordByFilter('animais', "categoria = 'Matriz PO' && id != {:id}", {
        id: matriz1.id,
      })
    } catch (_) {
      matriz2 = new Record(animaisCol)
      matriz2.set('id_manejo_brinco', 'M002')
      matriz2.set('categoria', 'Matriz PO')
      app.save(matriz2)
    }

    try {
      touro1 = app.findFirstRecordByFilter('animais', "categoria = 'Touro PO'")
    } catch (_) {
      touro1 = new Record(animaisCol)
      touro1.set('id_manejo_brinco', 'T001')
      touro1.set('categoria', 'Touro PO')
      app.save(touro1)
    }

    try {
      touro2 = app.findFirstRecordByFilter('animais', "categoria = 'Touro PO' && id != {:id}", {
        id: touro1.id,
      })
    } catch (_) {
      touro2 = new Record(animaisCol)
      touro2.set('id_manejo_brinco', 'T002')
      touro2.set('categoria', 'Touro PO')
      app.save(touro2)
    }

    const planCol = app.findCollectionByNameOrId('planejamento_acasalamento')
    try {
      app.findFirstRecordByData('planejamento_acasalamento', 'matriz_id', matriz1.id)
    } catch (_) {
      const r1 = new Record(planCol)
      r1.set('matriz_id', matriz1.id)
      r1.set('touro_opcao_1_id', touro1.id)
      r1.set('touro_opcao_2_id', touro2.id)
      app.save(r1)
    }

    try {
      app.findFirstRecordByData('planejamento_acasalamento', 'matriz_id', matriz2.id)
    } catch (_) {
      const r2 = new Record(planCol)
      r2.set('matriz_id', matriz2.id)
      r2.set('touro_opcao_1_id', touro2.id)
      app.save(r2)
    }

    const iatfCol = app.findCollectionByNameOrId('manejo_iatf_curral')
    try {
      app.findFirstRecordByData('manejo_iatf_curral', 'matriz_id', matriz1.id)
    } catch (_) {
      const r1 = new Record(iatfCol)
      r1.set('matriz_id', matriz1.id)
      r1.set('data_iatf', '2025-10-01 10:00:00.000Z')
      r1.set('touro_utilizado_id', touro1.id)
      r1.set('resultado_dg', 'Prenhe')
      r1.set('data_provavel_parto_dpp', '2026-07-10 10:00:00.000Z')
      app.save(r1)
    }

    try {
      app.findFirstRecordByData('manejo_iatf_curral', 'matriz_id', matriz2.id)
    } catch (_) {
      const r2 = new Record(iatfCol)
      r2.set('matriz_id', matriz2.id)
      r2.set('data_iatf', '2025-10-05 10:00:00.000Z')
      r2.set('touro_utilizado_id', touro2.id)
      r2.set('resultado_dg', 'Vazia')
      app.save(r2)
    }

    const nascCol = app.findCollectionByNameOrId('nascimentos_e_desmama')
    try {
      app.findFirstRecordByData('nascimentos_e_desmama', 'matriz_mae_id', matriz1.id)
    } catch (_) {
      const r1 = new Record(nascCol)
      r1.set('matriz_mae_id', matriz1.id)
      r1.set('data_nascimento', '2026-07-09 10:00:00.000Z')
      r1.set('sexo', 'Macho')
      r1.set('peso_nascer', 35)
      r1.set('status_cria', 'Ativo')
      r1.set('rgn_provisorio_abcz', '12345')
      app.save(r1)
    }

    try {
      app.findFirstRecordByData('nascimentos_e_desmama', 'matriz_mae_id', matriz2.id)
    } catch (_) {
      const r2 = new Record(nascCol)
      r2.set('matriz_mae_id', matriz2.id)
      r2.set('data_nascimento', '2026-07-15 10:00:00.000Z')
      r2.set('sexo', 'Fêmea')
      r2.set('peso_nascer', 32)
      r2.set('status_cria', 'Ativo')
      r2.set('rgn_provisorio_abcz', '12346')
      app.save(r2)
    }
  },
  (app) => {
    app.db().newQuery('DELETE FROM planejamento_acasalamento').execute()
    app.db().newQuery('DELETE FROM manejo_iatf_curral').execute()
    app.db().newQuery('DELETE FROM nascimentos_e_desmama').execute()
  },
)
