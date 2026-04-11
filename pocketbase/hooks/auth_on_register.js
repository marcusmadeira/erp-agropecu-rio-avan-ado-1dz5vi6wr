onRecordAfterCreateSuccess((e) => {
  const user = e.record

  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const validade = new Date()
  validade.setMinutes(validade.getMinutes() + 15)

  user.set('codigo_verificacao', code)
  user.set('validade_codigo', validade.toISOString())
  $app.saveNoValidate(user)

  const resendApiKey = $secrets.get('RESEND_API_KEY')
  if (resendApiKey) {
    try {
      $http.send({
        url: 'https://api.resend.com/emails',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Toriba Agropecuária <onboarding@resend.dev>',
          to: user.get('email'),
          subject: 'Seu código de verificação Toriba Agropecuária',
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #094016; text-align: center;">Toriba Agropecuária</h2>
              <p>Olá ${user.get('name') || ''},</p>
              <p>Obrigado por se cadastrar! Para ativar sua conta, por favor, utilize o código de verificação abaixo:</p>
              <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 4px; margin: 20px 0;">
                <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #094016;">${code}</span>
              </div>
              <p>Este código é válido por 15 minutos.</p>
              <p>Se você não solicitou este cadastro, pode ignorar este e-mail.</p>
            </div>
          `,
        }),
      })
    } catch (err) {
      console.log('Erro ao enviar email via Resend:', err)
    }
  }

  console.log(`[REGISTER CODE] Email: ${user.get('email')}, Code: ${code}`)

  e.next()
}, 'users')
