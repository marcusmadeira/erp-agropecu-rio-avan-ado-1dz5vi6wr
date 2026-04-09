const TABLES_TO_IGNORE = ['auditoria_movimentacoes', 'logs_sistema', 'notificacoes', 'conversas_ia']

function logAudit(e, actionType) {
  if (!e.collection || TABLES_TO_IGNORE.includes(e.collection.name)) return
  try {
    const auditCol = $app.findCollectionByNameOrId('auditoria_movimentacoes')
    const rec = new Record(auditCol)
    rec.set('usuario_id', e.auth ? e.auth.id : null)
    rec.set('tipo_acao', actionType)
    rec.set('tabela_afetada', e.collection.name)
    rec.set('registro_id', e.record.id)

    if (actionType === 'Criação' || actionType === 'Edição') {
      rec.set('dados_novos', JSON.stringify(e.record.publicExport()))
    } else if (actionType === 'Exclusão') {
      rec.set('dados_anteriores', JSON.stringify(e.record.publicExport()))
    }
    $app.saveNoValidate(rec)
  } catch (err) {
    console.log('Audit log error:', err.message)
  }
}

onRecordAfterCreateSuccess((e) => {
  logAudit(e, 'Criação')
  e.next()
})
onRecordAfterUpdateSuccess((e) => {
  logAudit(e, 'Edição')
  e.next()
})
onRecordAfterDeleteSuccess((e) => {
  logAudit(e, 'Exclusão')
  e.next()
})
