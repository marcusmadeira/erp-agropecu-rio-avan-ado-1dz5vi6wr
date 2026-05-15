routerAdd(
  'POST',
  '/backend/v1/extrair_nota_fiscal_ocr',
  (e) => {
    const files = e.findUploadedFiles('arquivo')
    if (!files || files.length === 0) {
      return e.badRequestError('Nenhum arquivo PDF enviado.')
    }

    // Simulating OCR processing time and response
    const ms = 1500
    const start = Date.now()
    while (Date.now() - start < ms) {}

    const randomNota = 'NF-' + Math.floor(Math.random() * 900000 + 100000)
    const dataHoje = new Date().toISOString().split('T')[0]

    const d = new Date()
    d.setDate(d.getDate() + 30)
    const dataVencimento = d.toISOString().split('T')[0]

    const result = {
      fornecedor: {
        nome: 'Agro Insumos S.A.',
        cnpj: '12.345.678/0001-90',
      },
      nota_fiscal: randomNota,
      data: dataHoje,
      data_vencimento: dataVencimento,
      valor_total: 14000.0,
      produtos: [
        {
          nome: 'Milho Grão (Saca 60kg)',
          quantidade: 100,
          valor_unitario: 55.0,
          valor_total: 5500.0,
          tipo: 'estoque',
        },
        {
          nome: 'Serviço de Frete e Logística',
          quantidade: 1,
          valor_unitario: 8500.0,
          valor_total: 8500.0,
          tipo: 'despesa',
        },
      ],
    }

    return e.json(200, result)
  },
  $apis.requireAuth(),
)
