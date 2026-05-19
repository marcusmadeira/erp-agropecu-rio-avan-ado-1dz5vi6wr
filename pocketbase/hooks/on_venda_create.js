onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    let userEmail = 'Sistema'
    let userId = ''

    const auditCol = $app.findCollectionByNameOrId('auditoria_movimentacoes')
    const auditRec = new Record(auditCol)

    try {
      const su = $app.findFirstRecordByFilter('users', "role = 'Admin'")
      userId = su.id
      userEmail = su.getString('email')
    } catch (_) {}

    if (userId) {
      auditRec.set('usuario_id', userId)
      auditRec.set('tipo_acao', 'VENDA_CRIADA')
      auditRec.set('tabela_afetada', 'vendas')
      auditRec.set('registro_id', record.id)
      auditRec.set('status', 'SUCCESS')
      auditRec.set('description', `Venda criada. Status: ${record.getString('status_venda')}`)
      auditRec.set('user_email', userEmail)
      $app.save(auditRec)
    }
  } catch (err) {
    $app.logger().error('Error logging VENDA_CRIADA', 'error', err.message)
  }
  e.next()
}, 'vendas')
