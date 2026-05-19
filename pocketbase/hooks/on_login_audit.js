onRecordAuthRequest((e) => {
  const record = e.record
  if (!record) return e.next()

  try {
    const auditCol = $app.findCollectionByNameOrId('auditoria_movimentacoes')
    const auditRec = new Record(auditCol)
    auditRec.set('usuario_id', record.id)
    auditRec.set('tipo_acao', 'LOGIN')
    auditRec.set('tabela_afetada', 'users')
    auditRec.set('registro_id', record.id)
    auditRec.set('status', 'SUCCESS')
    auditRec.set('description', 'Sessão iniciada')
    auditRec.set('user_email', record.getString('email'))
    auditRec.set('ip_address', e.requestInfo().remoteAddr || '')
    $app.saveNoValidate(auditRec)
  } catch (err) {
    $app.logger().error('Login audit failed', 'error', err.message)
  }

  e.next()
}, 'users')
