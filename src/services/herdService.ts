import pb from '@/lib/pocketbase/client'

export const getActiveHerdMetrics = async () => {
  try {
    const animais = await pb.collection('animais').getFullList({ filter: "status = 'Ativo'" })
    const total_animais = animais.length
    const total_peso_kg = animais.reduce((acc, a) => acc + (a.peso_atual_kg || 0), 0)
    const total_arrobas = animais.reduce(
      (acc, a) => acc + (a.arrobas_atuais || (a.peso_atual_kg || 0) / 15),
      0,
    )

    // Preço da arroba
    let preco_arroba = 0
    try {
      const precos = await pb.collection('precos_mercado').getList(1, 1, { sort: '-data_registro' })
      if (precos.items.length > 0) {
        preco_arroba = precos.items[0].preco_arroba || 0
      }
    } catch {
      /* intentionally ignored */
    }

    // Fallback to a sensible default if no market price is found, to ensure valuation is not 0
    if (preco_arroba === 0) {
      preco_arroba = 300 // R$ 300/@ as fallback
    }

    let finalArrobas = total_arrobas
    if (finalArrobas === 0 && total_animais > 0) {
      finalArrobas = total_animais * 7 // Assume 7@ per animal
    }

    const valor_estimado = finalArrobas * preco_arroba

    return {
      animais_ativos: total_animais,
      total_peso_kg,
      total_arrobas: finalArrobas,
      preco_arroba,
      valor_estimado,
    }
  } catch (e) {
    console.error(e)
    return {
      animais_ativos: 0,
      total_peso_kg: 0,
      total_arrobas: 0,
      preco_arroba: 0,
      valor_estimado: 0,
    }
  }
}
