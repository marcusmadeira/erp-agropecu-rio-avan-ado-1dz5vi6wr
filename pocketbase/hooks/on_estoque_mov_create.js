onRecordAfterCreateSuccess((e) => {
  const auditCol = $app.findCollectionByNameOrId('auditoria_movimentacoes')
  const record = new Record(auditCol)

  record.set('usuario_id', e.record.get('usuario_id'))
  record.set('tipo_acao', 'Criação')
  record.set('tabela_afetada', 'estoque_movimentacoes')
  record.set('registro_id', e.record.get('id'))
  record.set('dados_novos', JSON.stringify(e.record))

  $app.save(record)
  e.next()
}, 'estoque_movimentacoes')
