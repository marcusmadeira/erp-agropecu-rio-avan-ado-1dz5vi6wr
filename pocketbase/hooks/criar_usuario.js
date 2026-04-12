routerAdd('POST', '/backend/v1/criar_usuario', (e) => {
  const body = e.requestInfo().body
  const users = $app.findCollectionByNameOrId('users')

  let emailExists = false
  try {
    $app.findAuthRecordByEmail('users', body.email)
    emailExists = true
  } catch (err) {
    // Record not found, safe to proceed
  }
  if (emailExists) throw new BadRequestError('Email já está em uso')

  let loginExists = false
  try {
    $app.findFirstRecordByData('users', 'username', body.username || body.login)
    loginExists = true
  } catch (err) {
    // Record not found, safe to proceed
  }
  if (loginExists) throw new BadRequestError('Login já está em uso')

  const record = new Record(users)
  record.set('name', body.name || body.nome)
  record.setEmail(body.email)
  record.set('username', body.username || body.login)
  record.setPassword(body.password)
  record.set('nivel_acesso', body.nivel_acesso)

  if (body.phone) {
    record.set('phone', body.phone)
  }

  record.setVerified(false)
  $app.save(record)

  return e.json(200, record)
})
