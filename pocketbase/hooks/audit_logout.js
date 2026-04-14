routerAdd(
  'POST',
  '/backend/v1/audit/logout',
  (e) => {
    if (e.auth) {
      try {
        const auditCol = $app.findCollectionByNameOrId('auditoria_movimentacoes')
        const rec = new Record(auditCol)
        rec.set('usuario_id', e.auth.id)
        rec.set('user_email', e.auth.getString('email'))
        rec.set('user_role', e.auth.getString('role') || e.auth.getString('nivel_acesso'))
        rec.set('tipo_acao', 'LOGOUT')
        rec.set('tabela_afetada', 'users')
        rec.set('registro_id', e.auth.id)
        rec.set('status', 'SUCCESS')
        rec.set('description', 'Logout realizado com sucesso')
        rec.set('ip_address', e.requestInfo().clientIp || e.requestInfo().remoteIp || '')
        $app.saveNoValidate(rec)
      } catch (err) {
        console.log(err)
      }
    }
    return e.noContent(204)
  },
  $apis.requireAuth(),
)
