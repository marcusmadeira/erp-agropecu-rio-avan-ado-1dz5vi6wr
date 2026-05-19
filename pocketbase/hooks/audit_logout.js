routerAdd('POST', '/backend/v1/audit/logout', (e) => {
  if (!e.auth) return e.json(200, { success: true })

  try {
    const auditCol = $app.findCollectionByNameOrId('auditoria_movimentacoes')
    const auditRec = new Record(auditCol)
    auditRec.set('usuario_id', e.auth.id)
    auditRec.set('tipo_acao', 'LOGOUT')
    auditRec.set('tabela_afetada', 'users')
    auditRec.set('registro_id', e.auth.id)
    auditRec.set('status', 'SUCCESS')
    auditRec.set('description', 'Sessão encerrada')
    auditRec.set('user_email', e.auth.getString('email'))
    auditRec.set('ip_address', e.requestInfo().remoteAddr || '')
    $app.saveNoValidate(auditRec)
  } catch (err) {
    $app.logger().error('Logout audit failed', 'error', err.message)
  }

  return e.json(200, { success: true })
})
