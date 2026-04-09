onRecordAfterCreateSuccess((e) => {
  const TABLES_TO_IGNORE = [
    'auditoria_movimentacoes',
    'logs_sistema',
    'notificacoes',
    'conversas_ia',
  ]

  if (!e.collection || TABLES_TO_IGNORE.includes(e.collection.name)) {
    e.next()
    return
  }

  try {
    const auditCol = $app.findCollectionByNameOrId('auditoria_movimentacoes')
    const rec = new Record(auditCol)
    rec.set('usuario_id', e.auth ? e.auth.id : null)
    rec.set('tipo_acao', 'Criação')
    rec.set('tabela_afetada', e.collection.name)
    rec.set('registro_id', e.record.id)
    rec.set('dados_novos', JSON.stringify(e.record))

    $app.saveNoValidate(rec)
  } catch (err) {
    console.log('Audit log error:', err.message)
  }

  e.next()
})
