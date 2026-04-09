export function calcularAtraso(dataVencimento: string | undefined, valor: number, config?: any) {
  if (!dataVencimento) return { diasAtraso: 0, juros: 0, multa: 0, total: valor }
  const hoje = new Date()
  const venc = new Date(dataVencimento)
  hoje.setHours(0, 0, 0, 0)
  venc.setHours(0, 0, 0, 0)

  const diffTime = hoje.getTime() - venc.getTime()
  const diasAtraso = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))

  const ativarJuros = config ? config.ativar_juros_automaticos : true
  const ativarMulta = config ? config.ativar_multa_automatica : true
  const taxaJurosDiaria = config ? config.taxa_juros_diaria : 0.005
  const percentualMulta = config ? config.percentual_multa : 0.02

  const juros = diasAtraso > 0 && ativarJuros ? valor * taxaJurosDiaria * diasAtraso : 0
  const multa = diasAtraso > 0 && ativarMulta ? valor * percentualMulta : 0
  const total = valor + juros + multa

  return { diasAtraso, juros, multa, total }
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
