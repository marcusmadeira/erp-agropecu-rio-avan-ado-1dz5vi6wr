migrate(
  (app) => {
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'marcusmadeira@yahoo.com.br')
      const col = app.findCollectionByNameOrId('diagnostico_inicial')
      const record = new Record(col)
      record.set('usuario_id', admin.id)
      record.set('tamanho_ha', 1500)
      record.set('total_animais', 3500)
      record.set('arrobas_produzidas', 25000)
      record.set('custos', 5000000)
      record.set('receitas', 7500000)
      record.set('custo_arroba', 5000000 / 25000)
      record.set('lotacao', 3500 / 1500)
      record.set('produtividade_ha', 25000 / 1500)
      record.set('margem_lucro', ((7500000 - 5000000) / 7500000) * 100)
      record.set('roi', ((7500000 - 5000000) / 5000000) * 100)
      app.save(record)
    } catch (e) {}
  },
  (app) => {
    // do nothing on down
  },
)
