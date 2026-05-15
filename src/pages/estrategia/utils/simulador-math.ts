export interface SimInputs {
  tipo_operacao: string
  quantidade_animais: number
  peso_entrada: number
  preco_compra: number
  custo_acao: number
  custo_mao_obra: number
  custo_adicionais: number
  gmd_estimado: number
  dias_duracao: number
  preco_venda: number
}

export function calcularCenario(data: SimInputs) {
  // 1 Arroba = exactly 15 kg
  const arrobas_entrada = data.peso_entrada / 15
  const custo_compra = arrobas_entrada * data.preco_compra * data.quantidade_animais

  const peso_final = data.peso_entrada + data.gmd_estimado * data.dias_duracao
  const arrobas_final = peso_final / 15
  const arrobas_venda_total = arrobas_final * data.quantidade_animais
  const arrobas_produzidas_total = (arrobas_final - arrobas_entrada) * data.quantidade_animais

  const custo_diario = data.custo_acao + data.custo_mao_obra + data.custo_adicionais
  const custo_operacao = custo_diario * data.quantidade_animais * data.dias_duracao

  const custo_total = custo_compra + custo_operacao
  const receita_total = arrobas_venda_total * data.preco_venda
  const lucro_bruto = receita_total - custo_total
  const margem_lucro = receita_total > 0 ? (lucro_bruto / receita_total) * 100 : 0
  const roi = custo_total > 0 ? (lucro_bruto / custo_total) * 100 : 0
  const ponto_equilibrio = arrobas_venda_total > 0 ? custo_total / arrobas_venda_total : 0
  const custo_arroba_produzida =
    arrobas_produzidas_total > 0 ? custo_operacao / arrobas_produzidas_total : 0

  const sensibilidade = [
    {
      cenario: '-10%',
      preco: data.preco_venda * 0.9,
      lucro: arrobas_venda_total * (data.preco_venda * 0.9) - custo_total,
    },
    { cenario: 'Atual', preco: data.preco_venda, lucro: lucro_bruto },
    {
      cenario: '+10%',
      preco: data.preco_venda * 1.1,
      lucro: arrobas_venda_total * (data.preco_venda * 1.1) - custo_total,
    },
  ]

  return {
    peso_final,
    arrobas_venda_total,
    arrobas_produzidas_total,
    custo_total,
    receita_total,
    lucro_bruto,
    margem_lucro,
    roi,
    ponto_equilibrio,
    custo_arroba_produzida,
    sensibilidade,
    custo_compra,
    custo_operacao,
  }
}
