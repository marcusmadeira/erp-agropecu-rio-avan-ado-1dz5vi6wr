onRecordAfterDeleteSuccess((e) => {
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
    rec.set('tipo_acao', 'DELETE')
    rec.set('tabela_afetada', e.collection.name)
    rec.set('registro_id', e.record.id)
    rec.set('dados_anteriores', JSON.stringify(e.record))
    rec.set('status', 'SUCCESS')
    rec.set('description', 'Registro excluído')
    if (e.auth) {
      rec.set('user_email', e.auth.getString('email'))
      rec.set('user_role', e.auth.getString('role') || e.auth.getString('nivel_acesso'))
    }

    $app.saveNoValidate(rec)
  } catch (err) {
    console.log('Audit log error:', err.message)
  }

  e.next()
})
