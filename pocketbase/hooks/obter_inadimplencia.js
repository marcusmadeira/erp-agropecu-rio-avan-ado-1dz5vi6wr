routerAdd(
  'GET',
  '/backend/v1/obter_inadimplencia',
  (e) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const records = $app.findRecordsByFilter(
      'boletos',
      `data_vencimento < '${todayStr}' && status_boleto != 'Pago' && status_boleto != 'Cancelado'`,
      '-data_vencimento',
      500,
      0,
    )
    $apis.enrichRecords(e, records, 'parcela_id.venda_id.cliente_id')

    let totalOpenValue = 0
    let totalDiasAtraso = 0
    let countVencidos = 0
    const devedores = []

    for (let i = 0; i < records.length; i++) {
      const r = records[i]
      const valor = r.get('valor_boleto') || 0
      const vDateStr = r.get('data_vencimento').toString()
      let vDate = new Date(vDateStr)
      if (isNaN(vDate.getTime())) vDate = new Date()

      totalOpenValue += valor
      countVencidos++

      const diffTime = Math.abs(today - vDate)
      const diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      totalDiasAtraso += diasAtraso

      let clienteNome = 'Desconhecido'
      let clientePhone = ''
      try {
        const expand = r.expandedAll()
        if (expand && expand['parcela_id']) {
          const parcelaExpand = expand['parcela_id'].expandedAll()
          if (parcelaExpand && parcelaExpand['venda_id']) {
            const vendaExpand = parcelaExpand['venda_id'].expandedAll()
            if (vendaExpand && vendaExpand['cliente_id']) {
              const cliente = vendaExpand['cliente_id']
              clienteNome = cliente.get('nome_razao_social') || 'Desconhecido'
              clientePhone = cliente.get('contato_whatsapp') || ''
            }
          }
        }
      } catch (_) {}

      devedores.push({
        id: r.id,
        clienteNome: clienteNome,
        clientePhone: clientePhone,
        diasAtraso: diasAtraso,
        valor: valor,
        vencimento: vDateStr,
        boleto: r.get('numero_boleto') || r.id,
      })
    }

    devedores.sort((a, b) => b.diasAtraso - a.diasAtraso)
    const averageDelayDays = countVencidos > 0 ? totalDiasAtraso / countVencidos : 0

    return e.json(200, {
      totalOpenValue,
      overdueCount: countVencidos,
      averageDelayDays,
      tableData: devedores.slice(0, 10),
    })
  },
  $apis.requireAuth(),
)
