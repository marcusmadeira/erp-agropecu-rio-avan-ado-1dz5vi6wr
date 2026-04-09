onRecordCreate((e) => {
  const record = e.record
  const dataVencimento = record.get('data_vencimento')
  const dataPagamento = record.get('data_pagamento')
  let status = record.get('status_parcela')

  if (dataVencimento && !dataPagamento && status !== 'Paga' && status !== 'Cancelada') {
    const venc = new Date(dataVencimento)
    const now = new Date()
    const diffTime = now.getTime() - venc.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays > 0) {
      record.set('dias_atraso', diffDays)
      record.set('status_parcela', 'Atrasada')
    } else {
      record.set('dias_atraso', 0)
      if (status === 'Atrasada') {
        record.set('status_parcela', 'Pendente')
      }
    }
  } else if (dataPagamento) {
    record.set('status_parcela', 'Paga')
    const venc = new Date(dataVencimento)
    const pag = new Date(dataPagamento)
    const diffTime = pag.getTime() - venc.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    record.set('dias_atraso', diffDays > 0 ? diffDays : 0)
  } else {
    record.set('dias_atraso', 0)
  }

  const valor = record.get('valor_parcela') || 0
  const juros = record.get('juros_atraso') || 0
  const multa = record.get('multa_atraso') || 0
  record.set('valor_total_com_juros', valor + juros + multa)

  e.next()
}, 'parcelas_venda')
