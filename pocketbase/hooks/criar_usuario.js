routerAdd(
  'POST',
  '/backend/v1/criar_usuario',
  (e) => {
    const authRecord = e.auth
    if (!authRecord) throw new UnauthorizedError('Acesso negado')
    const requesterRole = authRecord.getString('role')
    const requesterNivel = authRecord.getString('nivel_acesso')

    if (requesterRole !== 'Admin' && requesterNivel !== 'Gerente' && !e.hasSuperuserAuth()) {
      throw new ForbiddenError('Apenas administradores podem criar usuários')
    }

    const body = e.requestInfo().body
    const users = $app.findCollectionByNameOrId('users')

    let emailExists = false
    try {
      $app.findAuthRecordByEmail('users', body.email)
      emailExists = true
    } catch (err) {}
    if (emailExists) throw new BadRequestError('Email já está em uso')

    let loginExists = false
    if (body.username || body.login) {
      try {
        $app.findFirstRecordByData('users', 'username', body.username || body.login)
        loginExists = true
      } catch (err) {}
    }
    if (loginExists) throw new BadRequestError('Login já está em uso')

    const record = new Record(users)
    record.set('name', body.name || body.nome)
    record.setEmail(body.email)
    if (body.username || body.login) {
      record.set('username', body.username || body.login)
    }
    record.setPassword(body.password)
    record.set('role', body.role || 'Operacional')
    record.set('status_usuario', body.status_usuario || 'Ativo')
    record.set('nivel_acesso', body.role === 'Admin' ? 'Gerente' : 'Operacional')

    record.setVerified(true)
    $app.save(record)

    // Audit Log
    try {
      const auditCol = $app.findCollectionByNameOrId('auditoria_movimentacoes')
      const auditRec = new Record(auditCol)
      auditRec.set('usuario_id', authRecord.id)
      auditRec.set('user_email', authRecord.getString('email'))
      auditRec.set('user_role', requesterRole || requesterNivel)
      auditRec.set('tipo_acao', 'CREATE')
      auditRec.set('tabela_afetada', 'users')
      auditRec.set('registro_id', record.id)
      auditRec.set('status', 'SUCCESS')
      auditRec.set('description', 'Novo usuário criado no sistema')
      auditRec.set('ip_address', e.requestInfo().clientIp || '')
      $app.saveNoValidate(auditRec)
    } catch (err) {
      console.log(err)
    }

    return e.json(200, record)
  },
  $apis.requireAuth(),
)
