routerAdd(
  'GET',
  '/backend/v1/obter_inadimplencia',
  (e) => {
    const records = $app.findRecordsByFilter('boletos_pagar', '1=1', '', 0, 0)

    let valorEmAberto = 0
    let previsao30Dias = 0
    let countPago = 0
    let countPendente = 0
    let countAtrasado = 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const in30Days = new Date(today)
    in30Days.setDate(today.getDate() + 30)

    const devedores = []

    for (let i = 0; i < records.length; i++) {
      const r = records[i]
      const status = r.get('status')
      const valor = r.get('valor') || 0
      const vDateStr = r.get('data_vencimento').toString()
      let vDate
      if (vDateStr) {
        vDate = new Date(vDateStr)
      } else {
        vDate = new Date()
      }

      if (status === 'Pendente' || status === 'Atrasado') {
        valorEmAberto += valor
      }

      if (status === 'Pendente' && vDate >= today && vDate <= in30Days) {
        previsao30Dias += valor
      }

      if (status === 'Pago') countPago++
      else if (status === 'Pendente') countPendente++
      else if (status === 'Atrasado') countAtrasado++

      if (status === 'Pendente' || status === 'Atrasado') {
        let diasAtraso = 0
        if (vDate < today) {
          const diffTime = Math.abs(today - vDate)
          diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        }

        if (diasAtraso > 0 || status === 'Atrasado') {
          let fornecedorNome = 'Desconhecido'
          let fornecedorPhone = ''
          const fornecedorId = r.get('fornecedor_id')
          if (fornecedorId) {
            try {
              const f = $app.findRecordById('parceiros_negocios', fornecedorId)
              fornecedorNome = f.get('nome_razao_social') || 'Desconhecido'
              fornecedorPhone = f.get('contato_whatsapp') || ''
            } catch (_) {}
          }

          devedores.push({
            id: r.id,
            clienteNome: fornecedorNome,
            clientePhone: fornecedorPhone,
            diasAtraso: diasAtraso,
            valor: valor,
            vencimento: vDateStr,
          })
        }
      }
    }

    devedores.sort((a, b) => b.diasAtraso - a.diasAtraso)

    return e.json(200, {
      valorEmAberto,
      previsao30Dias,
      pieData: [
        { name: 'Pago', value: countPago },
        { name: 'Pendente', value: countPendente },
        { name: 'Atrasado', value: countAtrasado },
      ],
      tableData: devedores.slice(0, 10),
    })
  },
  $apis.requireAuth(),
)
