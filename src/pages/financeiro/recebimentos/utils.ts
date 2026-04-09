export function calcularAtraso(dataVencimento: string | undefined, valor: number) {
  if (!dataVencimento) return { diasAtraso: 0, juros: 0, multa: 0, total: valor }
  const hoje = new Date()
  const venc = new Date(dataVencimento)
  hoje.setHours(0, 0, 0, 0)
  venc.setHours(0, 0, 0, 0)

  const diffTime = hoje.getTime() - venc.getTime()
  const diasAtraso = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))

  const juros = diasAtraso > 0 ? valor * 0.001 * diasAtraso : 0
  const multa = diasAtraso > 0 ? valor * 0.02 : 0
  const total = valor + juros + multa

  return { diasAtraso, juros, multa, total }
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
