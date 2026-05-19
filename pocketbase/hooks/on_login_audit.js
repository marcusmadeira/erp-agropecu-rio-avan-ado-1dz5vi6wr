onRecordAuthRequest((e) => {
  try {
    const record = e.record
    if (!record) return e.next()

    let path = ''
    try {
      if (e.request && e.request.url) {
        path = e.request.url.path || ''
      }
    } catch (_) {}

    if (path.endsWith('/auth-refresh')) {
      return e.next()
    }

    const auditCol = $app.findCollectionByNameOrId('auditoria_movimentacoes')
    const auditRec = new Record(auditCol)
    auditRec.set('usuario_id', record.id)
    auditRec.set('tipo_acao', 'LOGIN')
    auditRec.set('tabela_afetada', 'users')
    auditRec.set('registro_id', record.id)
    auditRec.set('status', 'SUCCESS')
    auditRec.set('description', 'Sessão iniciada')
    auditRec.set('user_email', record.getString('email') || '')

    let ip = ''
    try {
      if (e.request) {
        ip = e.request.remoteAddr || ''
      }
    } catch (_) {}
    auditRec.set('ip_address', ip)

    $app.saveNoValidate(auditRec)
  } catch (err) {
    $app.logger().error('Login audit failed', 'error', err ? err.message : String(err))
  }

  return e.next()
}, 'users')
