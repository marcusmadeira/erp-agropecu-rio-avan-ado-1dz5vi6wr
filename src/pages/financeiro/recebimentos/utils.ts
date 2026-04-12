import { differenceInDays } from 'date-fns'

export const formatCurrency = (val: number | undefined) => {
  if (!val) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

export const calcularAtraso = (vencimento: string, valor: number, config?: any) => {
  if (!vencimento || !valor) return { diasAtraso: 0, juros: 0, multa: 0, total: 0 }
  const dtVenc = new Date(vencimento)
  const dtHoje = new Date()
  const dias = differenceInDays(dtHoje, dtVenc)
  if (dias <= 0) return { diasAtraso: 0, juros: 0, multa: 0, total: valor }

  const jurosDia = config?.taxa_juros_diaria || 0.005
  const percMulta = config?.percentual_multa || 0.02
  const juros = valor * jurosDia * dias
  const multa = valor * percMulta
  return { diasAtraso: dias, juros, multa, total: valor + juros + multa }
}
