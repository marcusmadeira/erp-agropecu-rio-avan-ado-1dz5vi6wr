routerAdd(
  'POST',
  '/backend/v1/extrair_nota_fiscal_ocr',
  (e) => {
    const files = e.findUploadedFiles('arquivo')
    if (!files || files.length === 0) {
      return e.badRequestError('Nenhum arquivo PDF enviado.')
    }

    // Simulating OCR processing time and response (as Gemini API keys are not available here)
    const ms = 1500
    const start = Date.now()
    while (Date.now() - start < ms) {}

    const randomNota = 'NF-' + Math.floor(Math.random() * 900000 + 100000)
    const dataHoje = new Date().toISOString().split('T')[0]

    const result = {
      fornecedor: 'Agro Insumos S.A.',
      nota_fiscal: randomNota,
      data: dataHoje,
      produtos: [
        {
          nome: 'Milho Grão (Saca 60kg)',
          quantidade: 100,
          valor_unitario: 55.0,
          valor_total: 5500.0,
        },
        {
          nome: 'Farelo de Soja',
          quantidade: 50,
          valor_unitario: 120.0,
          valor_total: 6000.0,
        },
        {
          nome: 'Núcleo Mineral',
          quantidade: 10,
          valor_unitario: 250.0,
          valor_total: 2500.0,
        },
      ],
    }

    return e.json(200, result)
  },
  $apis.requireAuth(),
)
