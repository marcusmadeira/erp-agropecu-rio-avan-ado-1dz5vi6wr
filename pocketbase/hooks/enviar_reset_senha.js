routerAdd('POST', '/backend/v1/enviar_reset_senha', (e) => {
  const body = e.requestInfo().body
  const identity = (body.login || body.email || '').trim()

  if (!identity) {
    throw new BadRequestError('Identificação é obrigatória')
  }

  let userId = ''
  try {
    const result = new DynamicModel({ id: '' })
    $app
      .db()
      .newQuery(
        'SELECT id FROM users WHERE LOWER(email) = LOWER({:identity}) OR LOWER(login) = LOWER({:identity}) LIMIT 1',
      )
      .bind({ identity })
      .one(result)
    userId = result.id
  } catch (_) {
    throw new BadRequestError('Email não encontrado')
  }

  const user = $app.findRecordById('users', userId)
  const email = user.getString('email')

  if (!email) {
    throw new BadRequestError('Usuário não possui email cadastrado')
  }

  // Generate 6 digit code
  const code = $security.randomStringWithAlphabet(6, '0123456789')

  // Set expiration to 1 hour from now
  const now = new Date()
  now.setHours(now.getHours() + 1)
  const expiresIso = now.toISOString().replace('T', ' ')

  user.set('reset_code', code)
  user.set('reset_code_expires', expiresIso)

  $app.save(user)

  // Send Email via Resend
  const resendApiKey = $secrets.get('RESEND_API_KEY')
  if (resendApiKey) {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>Recuperação de Senha - TORIBA AGROPECUÁRIA</h2>
        <p>Olá ${user.getString('name') || 'Usuário'},</p>
        <p>Você solicitou a recuperação de senha para sua conta.</p>
        <p>Seu código de verificação é:</p>
        <h1 style="font-size: 32px; letter-spacing: 4px; color: #2563eb; background: #f3f4f6; padding: 12px; text-align: center; border-radius: 8px;">${code}</h1>
        <p>Este código é válido por 1 hora.</p>
        <p>Se você não solicitou esta recuperação, por favor ignore este email.</p>
        <br>
        <p>Atenciosamente,<br>Equipe TORIBA AGROPECUÁRIA</p>
      </div>
    `

    const res = $http.send({
      url: 'https://api.resend.com/emails',
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + resendApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Toriba Agropecuária <nao-responda@usecurling.com>',
        to: [email],
        subject: 'Recuperação de Senha - Código de Verificação',
        html: htmlBody,
      }),
      timeout: 15,
    })

    if (res.statusCode >= 400) {
      console.log('Erro ao enviar email de reset:', res.json)
    }
  } else {
    console.log('RESEND_API_KEY não configurada. Código gerado:', code)
  }

  return e.json(200, { message: 'Código enviado com sucesso' })
})
