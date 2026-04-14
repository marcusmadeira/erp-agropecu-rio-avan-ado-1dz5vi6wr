routerAdd('POST', '/backend/v1/autenticar_usuario', (e) => {
  const body = e.requestInfo().body || {}
  const identity = (body.login || body.email || '').trim()
  const password = body.password || ''
  const ip = e.requestInfo().clientIp || e.requestInfo().remoteIp || ''

  const auditCol = $app.findCollectionByNameOrId('auditoria_movimentacoes')
  const logAttempt = (status, userRecord, desc) => {
    try {
      const rec = new Record(auditCol)
      if (userRecord) {
        rec.set('usuario_id', userRecord.id)
        rec.set('user_email', userRecord.getString('email'))
        rec.set('user_role', userRecord.getString('role') || userRecord.getString('nivel_acesso'))
        rec.set('tipo_acao', 'LOGIN')
        rec.set('tabela_afetada', 'users')
        rec.set('registro_id', userRecord.id)
        rec.set('description', desc)
        rec.set('ip_address', ip)
        rec.set('status', status)
        $app.saveNoValidate(rec)
      }
    } catch (err) {
      console.log(err)
    }
  }

  if (!identity || !password) {
    throw new BadRequestError('Email/Login e senha são obrigatórios')
  }

  let userId = ''
  try {
    const result = new DynamicModel({ id: '' })
    $app
      .db()
      .newQuery(
        'SELECT id FROM users WHERE LOWER(email) = LOWER({:identity}) OR LOWER(login) = LOWER({:identity}) OR LOWER(username) = LOWER({:identity}) LIMIT 1',
      )
      .bind({ identity })
      .one(result)
    userId = result.id
  } catch (_) {
    throw new BadRequestError('Email não encontrado')
  }

  let user
  try {
    user = $app.findRecordById('users', userId)
  } catch (_) {
    throw new BadRequestError('Email não encontrado')
  }

  if (!user.validatePassword(password)) {
    logAttempt('FAILED', user, 'Tentativa de login com senha incorreta')
    throw new BadRequestError('Senha incorreta')
  }

  if (user.getString('status_usuario') === 'Inativo') {
    logAttempt('FAILED', user, 'Tentativa de login por usuário inativo')
    throw new BadRequestError('Usuário inativo')
  }

  logAttempt('SUCCESS', user, 'Login realizado com sucesso')
  return $apis.recordAuthResponse($app, e, user)
})
