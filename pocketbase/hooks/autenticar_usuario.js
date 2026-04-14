routerAdd('POST', '/backend/v1/autenticar_usuario', (e) => {
  const body = e.requestInfo().body || {}
  const identity = (body.login || body.email || '').trim()
  const password = body.password || ''

  if (!identity || !password) {
    throw e.badRequestError('Email/Login e senha são obrigatórios')
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
    throw e.badRequestError('Usuário não encontrado')
  }

  let user
  try {
    user = $app.findRecordById('users', userId)
  } catch (_) {
    throw e.badRequestError('Usuário não encontrado')
  }

  if (!user.validatePassword(password)) {
    throw e.badRequestError('Senha incorreta')
  }

  return $apis.recordAuthResponse($app, e, user)
})
