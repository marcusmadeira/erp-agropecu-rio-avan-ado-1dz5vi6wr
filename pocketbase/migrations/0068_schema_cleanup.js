migrate(
  (app) => {
    // 1. Data Migration: registro_nascimento -> nascimentos_e_desmama
    try {
      const records = app.findRecordsByFilter('registro_nascimento', '1=1', '', 10000, 0)
      if (records && records.length > 0) {
        const nascimentosCol = app.findCollectionByNameOrId('nascimentos_e_desmama')
        for (let i = 0; i < records.length; i++) {
          const r = records[i]
          const newRecord = new Record(nascimentosCol)
          newRecord.set('matriz_mae_id', r.get('vaca_mae_id'))
          newRecord.set('data_nascimento', r.get('data_nascimento'))
          newRecord.set('sexo', r.get('sexo'))
          newRecord.set('peso_nascer', r.get('peso_nascer'))
          newRecord.set('rgn_provisorio_abcz', r.get('rgn_abcz'))
          newRecord.set('status_cria', r.get('status_rgn'))
          app.save(newRecord)
        }
      }
      const colToDel = app.findCollectionByNameOrId('registro_nascimento')
      app.delete(colToDel)
    } catch (e) {
      console.log('Migration of registro_nascimento failed or skipped', e.message)
    }

    // 2. Field Normalization: Lotes
    try {
      app
        .db()
        .newQuery(
          'UPDATE lotes SET custo_acumulado_nutricao = custo_accumulado_nutricao WHERE custo_accumulado_nutricao IS NOT NULL',
        )
        .execute()
      const lotesCol = app.findCollectionByNameOrId('lotes')
      if (lotesCol.fields.getByName('custo_accumulado_nutricao')) {
        lotesCol.fields.removeByName('custo_accumulado_nutricao')
        app.save(lotesCol)
      }
    } catch (e) {
      console.log('Lotes typo fix skipped', e.message)
    }

    // 3. Field Normalization: Animais
    try {
      app
        .db()
        .newQuery(
          'UPDATE animais SET custo_variavel_acumulado = custo_variavel_accumulado WHERE custo_variavel_accumulado IS NOT NULL',
        )
        .execute()
      const animaisCol = app.findCollectionByNameOrId('animais')
      if (animaisCol.fields.getByName('custo_variavel_accumulado')) {
        animaisCol.fields.removeByName('custo_variavel_accumulado')
        app.save(animaisCol)
      }
    } catch (e) {
      console.log('Animais typo fix skipped', e.message)
    }

    // 4. User Verification
    try {
      const user = app.findAuthRecordByEmail('users', 'marcusmadeira@yahoo.com.br')
      user.set('nivel_acesso', 'Gerente')
      app.save(user)
    } catch (e) {
      console.log('User verification skipped', e.message)
    }
  },
  (app) => {
    // Reverting schema deletions perfectly is complex and beyond the scope of this cleanup.
  },
)
