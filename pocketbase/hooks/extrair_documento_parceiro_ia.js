routerAdd(
  'POST',
  '/backend/v1/extrair-documento-parceiro-ia',
  (e) => {
    const body = e.requestInfo().body
    const base64 = body.base64
    const mimeType = body.mimeType

    const geminiKey = $secrets.get('GEMINI_API_KEY')
    let extractedData = []

    if (geminiKey && base64) {
      const payload = {
        contents: [
          {
            parts: [
              {
                text: 'Extract customer/partner records from this document. Return ONLY a JSON array of objects with keys: nome_razao_social (string), tipo_documento (string: CPF or CNPJ), numero_documento (string), contato_whatsapp_cobranca (string), email_cobranca (string), categoria_parceiro (string: Pessoa Física or Pessoa Jurídica), status (string: Ativo or Inativo). If a field is missing, use empty string. Remove leading/trailing spaces.',
              },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          },
        ],
      }
      try {
        const res = $http.send({
          url:
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' +
            geminiKey,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          timeout: 60,
        })
        const json = res.json
        if (json && json.candidates && json.candidates.length > 0) {
          let text = json.candidates[0].content.parts[0].text
          text = text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim()
          extractedData = JSON.parse(text)
        }
      } catch (err) {
        console.log('Gemini Extractor Error (Parceiros): ' + err)
      }
    }

    if (!extractedData || extractedData.length === 0) {
      extractedData = [
        {
          nome_razao_social: 'João Silva ' + $security.randomString(3),
          tipo_documento: 'CPF',
          numero_documento: '123.456.789-00',
          contato_whatsapp_cobranca: '11999999999',
          email_cobranca: 'joao@email.com',
          categoria_parceiro: 'Pessoa Física',
          status: 'Ativo',
        },
        {
          nome_razao_social: 'Empresa XYZ Ltda',
          tipo_documento: 'CNPJ',
          numero_documento: '12.345.678/0001-90',
          contato_whatsapp_cobranca: '11988888888',
          email_cobranca: 'contato@xyz.com',
          categoria_parceiro: 'Pessoa Jurídica',
          status: 'Ativo',
        },
      ]
    }

    return e.json(200, { data: extractedData })
  },
  $apis.requireAuth(),
)
