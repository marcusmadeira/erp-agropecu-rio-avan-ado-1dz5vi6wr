import { Animal, Lote, AppState } from '@/stores/types'
import pb from '@/lib/pocketbase/client'
import localLogo from '@/assets/whatsapp-image-2026-03-16-at-16.52.11-c60ad.jpeg'

async function getActiveLogoUrl() {
  try {
    const records = await pb.collection('configuracoes_sistema').getList(1, 1)
    if (records.items.length > 0 && records.items[0].logo) {
      return pb.files.getURL(records.items[0], records.items[0].logo)
    }
  } catch (e) {
    console.error('Failed to load dynamic logo for PDF', e)
  }
  return window.location.origin + localLogo
}

const logoSvg = `
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:40px;height:40px;margin-right:15px;vertical-align:middle;">
    <circle cx="50" cy="50" r="50" fill="#094016" />
    <path d="M44 28 C44 24.686 46.686 22 50 22 C53.314 22 56 24.686 56 28 L56 72 C56 75.314 53.314 78 50 78 C46.686 78 44 75.314 44 72 L44 28 Z" fill="white" />
    <path d="M24 35 C24 31 18 31 18 35 C18 55 28 68 36 74 C38 75.5 41 72 39 70 C32 65 24 53 24 35 Z" fill="white" />
    <path d="M76 35 C76 31 82 31 82 35 C82 55 72 68 64 74 C62 75.5 59 72 61 70 C68 65 76 53 76 35 Z" fill="white" />
  </svg>
`

async function printPDF(title: string, html: string) {
  const win = window.open('', '_blank')
  if (!win) return

  const logoUrl = await getActiveLogoUrl()
  const absoluteLogoUrl =
    logoUrl.startsWith('http') || logoUrl.startsWith('data:')
      ? logoUrl
      : window.location.origin + (logoUrl.startsWith('/') ? '' : '/') + logoUrl

  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #000000; margin: 0; padding: 20px; }
          h1, h2, h3 { color: #094016; margin-top: 0; }
          .header { display: flex; align-items: center; border-bottom: 2px solid #094016; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { display: flex; align-items: center; font-weight: bold; font-size: 28px; margin-right: 20px; letter-spacing: -0.5px; color: #094016; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background: #f8fafc; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
          th { background-color: #f1f5f9; text-align: left; padding: 10px; border: 1px solid #e2e8f0; color: #094016; }
          td { padding: 10px; border: 1px solid #e2e8f0; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background: #e2e8f0; color: #094016; }
          .footer { margin-top: 40px; border-top: 2px solid #094016; padding-top: 20px; display: flex; align-items: flex-start; page-break-inside: avoid; }
          .footer-logo { width: 64px; height: 64px; object-fit: contain; flex-shrink: 0; }
          .footer-text { margin-left: 15px; font-size: 12px; color: #64748b; }
          .footer-text-brand { margin: 0; font-weight: bold; color: #094016; }
          .footer-text-p { margin: 0; }
        </style>
      </head>
      <body onload="setTimeout(() => { window.print(); setTimeout(() => window.close(), 500); }, 500);">
        ${html}
        <div class="footer">
          <img src="${absoluteLogoUrl}" class="footer-logo" />
          <div class="footer-text">
            <p class="footer-text-brand">TORIBA AGROPECUÁRIA</p>
            <p class="footer-text-p">Relatório gerado eletronicamente pelo sistema Gestão Pecuária 360º</p>
            <p class="footer-text-p">${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
    </html>
  `)
  win.document.close()
}

export async function exportAnimalPDF(animal: Animal, state: AppState) {
  const lote = state.lotes.find((l) => l.id === animal.loteId)
  const pai = state.animais.find((a) => a.id === animal.pai)
  const mae = state.animais.find((a) => a.id === animal.mae)

  const history = state.pesagens
    .filter((p) => p.animalId === animal.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const reproHistory = state.reproducoes
    .filter((r) => r.animalId === animal.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const generateChart = () => {
    if (history.length < 2) return '<p>Dados insuficientes para gráfico de progresso.</p>'
    const maxW = Math.max(...history.map((h) => h.weight))
    return history
      .map((h) => {
        const width = Math.round((h.weight / maxW) * 100)
        return `
        <div style="margin-bottom: 5px; display: flex; align-items: center; font-size: 12px;">
          <div style="width: 80px;">${new Date(h.date).toLocaleDateString()}</div>
          <div style="flex-grow: 1; background: #e5e7eb; height: 16px; border-radius: 4px; overflow: hidden; margin: 0 10px;">
            <div style="width: ${width}%; background: #094016; height: 100%;"></div>
          </div>
          <div style="width: 50px; text-align: right; font-weight: bold;">${h.weight}kg</div>
        </div>
      `
      })
      .join('')
  }

  const html = `
    <div class="header">
      <div class="logo">${logoSvg} TORIBA AGROPECUÁRIA</div>
      <div style="margin-left: auto; text-align: right;">
        <h2 style="margin:0;">Ficha Individual do Animal</h2>
        <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">Gerado em: ${new Date().toLocaleString()}</p>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h3>Identificação</h3>
        <p><strong>Nome:</strong> ${animal.nomeAnimal || 'N/A'}</p>
        <p><strong>Brinco (ID Manejo):</strong> ${animal.brinco}</p>
        <p><strong>RGN/RGD ABCZ:</strong> ${animal.rgn || 'N/A'}</p>
        <p><strong>Sexo:</strong> ${animal.gender === 'M' ? 'Macho' : 'Fêmea'}</p>
      </div>
      <div class="card">
        <h3>Classificação e Status</h3>
        <p><strong>Categoria:</strong> ${animal.categoria}</p>
        <p><strong>Status Atual:</strong> <span class="badge">${animal.status}</span></p>
        <p><strong>Lote:</strong> ${lote ? lote.name : 'Sem Lote'}</p>
        <p><strong>Centro de Custo:</strong> ${animal.costCenter}</p>
      </div>
    </div>

    <div class="grid" style="margin-top: 20px;">
      <div class="card">
        <h3>Genealogia (Pedigree)</h3>
        <p><strong>Pai:</strong> ${pai ? `${pai.nomeAnimal || ''} (${pai.brinco}) - ${pai.rgn || 'S/RGN'}` : 'Desconhecido'}</p>
        <p><strong>Mãe:</strong> ${mae ? `${mae.nomeAnimal || ''} (${mae.brinco}) - ${mae.rgn || 'S/RGN'}` : 'Desconhecida'}</p>
      </div>
      <div class="card">
        <h3>Investimento Acumulado (Nutrição/Sanidade)</h3>
        <p style="font-size: 24px; font-weight: bold; color: #094016; margin: 10px 0;">
          R$ ${(animal.custoAcumulado || 0).toFixed(2)}
        </p>
        <p style="font-size: 12px; color: #64748b;">*Custo variável acumulado através do manejo diário no lote.</p>
      </div>
    </div>

    <div class="grid" style="margin-top: 20px;">
      <div>
        <h3>Progresso de Peso (GMD)</h3>
        <p><strong>Peso Inicial:</strong> ${animal.pesoEntrada || '-'} kg</p>
        <p><strong>Peso Atual:</strong> ${animal.pesoAtual} kg</p>
        <p><strong>GMD Médio:</strong> ${animal.gmd.toFixed(3)} kg/dia</p>
        
        <div style="margin-top: 15px;">
          ${generateChart()}
        </div>
      </div>
      
      <div>
        <h3>Histórico Reprodutivo / Eventos</h3>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Evento / Touro</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${
              reproHistory.length > 0
                ? reproHistory
                    .map(
                      (r) => `
                <tr>
                  <td>${new Date(r.date).toLocaleDateString()}</td>
                  <td>${r.type} ${r.touro ? `(${r.touro})` : ''}</td>
                  <td><span class="badge">${r.status}</span></td>
                </tr>
              `,
                    )
                    .join('')
                : `<tr><td colspan="3" class="text-center">Nenhum evento registrado.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>
  `
  await printPDF(`Ficha_${animal.brinco}`, html)
}

export async function exportFluxoCaixaPDF(summary: any, expenses: number, filters: any) {
  const html = `
    <div class="header">
      <div class="logo">${logoSvg} TORIBA AGROPECUÁRIA</div>
      <div style="margin-left: auto; text-align: right;">
        <h2 style="margin:0;">Relatório de Fluxo de Caixa</h2>
        <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">Gerado em: ${new Date().toLocaleString()}</p>
      </div>
    </div>
    <div class="card" style="margin-bottom: 20px;">
      <h3>Filtros Aplicados</h3>
      <p><strong>Período:</strong> ${filters.period === 'all' ? 'Todo o Período' : filters.period}</p>
      <p><strong>Cliente:</strong> ${filters.client === 'all' ? 'Todos' : filters.client}</p>
      <p><strong>Tipo de Gado:</strong> ${filters.livestockType === 'all' ? 'Todos' : filters.livestockType}</p>
      <p><strong>Forma de Pagamento:</strong> ${filters.paymentMethod === 'all' ? 'Todas' : filters.paymentMethod}</p>
    </div>
    <div class="grid">
      <div class="card">
        <h3>Resumo de Receitas</h3>
        <p><strong>Receita Realizada (Paga):</strong> R$ ${summary.realized.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        <p><strong>Receita Esperada (Pendente):</strong> R$ ${summary.expected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        <p><strong>Atrasos:</strong> R$ ${summary.arrears.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        <hr style="margin: 10px 0; border: 0; border-top: 1px dashed #cbd5e1;" />
        <p><strong>Total de Entradas (Realizada):</strong> R$ ${summary.realized.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      </div>
      <div class="card">
        <h3>Resumo de Despesas</h3>
        <p><strong>Despesas Totais:</strong> R$ ${expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      </div>
    </div>
    <div class="card" style="margin-top: 20px; background-color: #f1f5f9;">
      <h3>Saldo Consolidado (Realizado - Despesas)</h3>
      <p style="font-size: 24px; font-weight: bold; color: ${summary.realized - expenses >= 0 ? '#094016' : '#dc2626'};">
        R$ ${(summary.realized - expenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </p>
    </div>
  `
  await printPDF('Relatorio_Fluxo_Caixa', html)
}

export async function exportFinancialReportPDF(data: Record<string, number>, filters: any) {
  const html = `
    <div class="header">
      <div class="logo">${logoSvg} TORIBA AGROPECUÁRIA</div>
      <div style="margin-left: auto; text-align: right;">
        <h2 style="margin:0;">Relatório Financeiro Agrupado</h2>
        <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">Gerado em: ${new Date().toLocaleString()}</p>
      </div>
    </div>
    <div class="card" style="margin-bottom: 20px;">
      <h3>Filtros Aplicados</h3>
      <p><strong>Período:</strong> ${filters.dateFrom || 'Início'} até ${filters.dateTo || 'Hoje'}</p>
      <p><strong>Tipo Movimento:</strong> ${filters.tipo || 'Todos'}</p>
      <p><strong>Classificação de Custo:</strong> ${filters.classificacao || 'Todas'}</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>Centro de Custo</th>
          <th class="text-right">Valor Total (R$)</th>
        </tr>
      </thead>
      <tbody>
        ${
          Object.entries(data).length > 0
            ? Object.entries(data)
                .map(
                  ([cc, val]) => `
          <tr>
            <td><strong>${cc}</strong></td>
            <td class="text-right font-mono">${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `,
                )
                .join('')
            : '<tr><td colspan="2" class="text-center">Nenhum dado encontrado no período.</td></tr>'
        }
      </tbody>
      <tfoot>
        <tr>
          <th class="text-right"><strong>TOTAL GERAL</strong></th>
          <th class="text-right font-mono" style="font-size: 16px;"><strong>R$ ${Object.values(data)
            .reduce((a, b) => a + b, 0)
            .toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}</strong></th>
        </tr>
      </tfoot>
    </table>
  `
  await printPDF('Relatorio_Financeiro_Resumo', html)
}

export async function exportSimulacaoPDF(sim: any, userName: string) {
  const dataStr = new Date(sim.created || new Date()).toLocaleDateString('pt-BR')

  const html = `
    <div class="header">
      <div class="logo">${logoSvg} TORIBA AGROPECUÁRIA</div>
      <div style="margin-left: auto; text-align: right;">
        <h2 style="margin:0;">Relatório Gerencial de Simulação (${sim.tipo_operacao || 'TIP'})</h2>
        <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">Data da Simulação: ${dataStr}</p>
        <p style="margin: 2px 0 0 0; color: #64748b; font-size: 12px;">Autor: ${userName}</p>
        <p style="margin: 2px 0 0 0; color: #64748b; font-size: 12px;">ID Cenário: ${sim.id}</p>
      </div>
    </div>

    <div class="grid" style="margin-bottom: 20px;">
      <div class="card">
        <h3>Identificação & Premissas do Lote</h3>
        <p><strong>Tipo de Operação:</strong> ${sim.tipo_operacao}</p>
        <p><strong>Quantidade de Animais:</strong> ${sim.quantidade_animais}</p>
        <p><strong>Peso de Entrada:</strong> ${sim.peso_entrada ? sim.peso_entrada + ' kg' : 'N/A'}</p>
        <p><strong>Preço de Compra (@):</strong> ${sim.preco_compra ? 'R$ ' + sim.preco_compra.toFixed(2) : 'N/A'}</p>
        <p><strong>Duração Estimada:</strong> ${sim.dias_duracao ? sim.dias_duracao + ' dias' : 'N/A'}</p>
      </div>
      <div class="card">
        <h3>Indicadores Zootécnicos</h3>
        <p><strong>GMD Estimado:</strong> ${sim.gmd_estimado ? sim.gmd_estimado.toFixed(3) + ' kg/dia' : 'N/A'}</p>
        <p><strong>Peso Final Projetado:</strong> ${sim.peso_final ? sim.peso_final.toFixed(1) + ' kg' : 'N/A'}</p>
        <p><strong>Arrobas Produzidas:</strong> ${sim.arrobas_produzidas ? sim.arrobas_produzidas.toFixed(2) + ' @' : 'N/A'}</p>
      </div>
    </div>

    <div class="grid" style="margin-bottom: 20px;">
      <div class="card">
        <h3>Custos Detalhados (Estimativa Diária/Animal)</h3>
        <p><strong>Custo Ração/dia:</strong> ${sim.custo_acao ? 'R$ ' + sim.custo_acao.toFixed(2) : 'Não Informado'}</p>
        <p><strong>Custo Mão de Obra/dia:</strong> ${sim.custo_mao_obra ? 'R$ ' + sim.custo_mao_obra.toFixed(2) : 'Não Informado'}</p>
        <p><strong>Custos Adicionais/dia:</strong> ${sim.custo_adicionais ? 'R$ ' + sim.custo_adicionais.toFixed(2) : 'Não Informado'}</p>
      </div>
      <div class="card">
        <h3>Indicadores Econômico-Financeiros</h3>
        <p><strong>Custo Total Operacional:</strong> ${sim.custo_total ? 'R$ ' + sim.custo_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'N/A'}</p>
        <p><strong>Custo por @ Produzida:</strong> ${sim.custo_arroba ? 'R$ ' + sim.custo_arroba.toFixed(2) : 'N/A'}</p>
        <p><strong>Preço de Venda (@):</strong> ${sim.preco_venda ? 'R$ ' + sim.preco_venda.toFixed(2) : 'N/A'}</p>
      </div>
    </div>

    <div class="card" style="background-color: #f1f5f9; border-left: 4px solid #094016;">
      <h3>Resultado Final Projetado</h3>
      <div class="grid" style="grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px;">
         <div>
           <p style="margin:0; font-size: 12px; color: #64748b;">Receita Total</p>
           <p style="margin:0; font-size: 18px; font-weight: bold; color: #0f172a;">${sim.receita_total ? 'R$ ' + sim.receita_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'N/A'}</p>
         </div>
         <div>
           <p style="margin:0; font-size: 12px; color: #64748b;">Lucro Bruto</p>
           <p style="margin:0; font-size: 18px; font-weight: bold; color: ${sim.lucro_bruto >= 0 ? '#094016' : '#dc2626'};">${sim.lucro_bruto ? 'R$ ' + sim.lucro_bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'N/A'}</p>
         </div>
         <div>
           <p style="margin:0; font-size: 12px; color: #64748b;">Margem de Lucro</p>
           <p style="margin:0; font-size: 18px; font-weight: bold; color: ${sim.margem_lucro >= 0 ? '#094016' : '#dc2626'};">${sim.margem_lucro ? sim.margem_lucro.toFixed(2) + '%' : 'N/A'}</p>
         </div>
         <div>
           <p style="margin:0; font-size: 12px; color: #64748b;">ROI</p>
           <p style="margin:0; font-size: 18px; font-weight: bold; color: ${sim.roi >= 0 ? '#094016' : '#dc2626'};">${sim.roi ? sim.roi.toFixed(2) + '%' : 'N/A'}</p>
         </div>
      </div>
    </div>
  `
  await printPDF('Relatorio_Simulacao_' + sim.id, html)
}

export async function exportLotePDF(lote: Lote, state: AppState) {
  const animaisLote = state.animais.filter((a) => a.loteId === lote.id && a.status === 'Ativo')
  const qtd = animaisLote.length

  const pesoInicial = animaisLote.reduce((acc, a) => acc + (a.pesoEntrada || a.pesoAtual), 0)
  const pesoFinal = animaisLote.reduce((acc, a) => acc + a.pesoAtual, 0)
  const ganhoTotal = pesoFinal - pesoInicial

  const pesoMedio = qtd > 0 ? (pesoFinal / qtd).toFixed(1) : '0.0'
  const gmdMedio =
    qtd > 0 ? (animaisLote.reduce((acc, a) => acc + a.gmd, 0) / qtd).toFixed(3) : '0.000'

  const pasto = state.pastos.find((p) => p.loteId === lote.id)

  const lotManejos = state.manejos.filter((m) => m.loteId === lote.id)
  const custoVariavel = lotManejos.reduce((acc, m) => acc + (m.cost || 0), 0)

  const fixedCosts = state.transacoes
    .filter((t) => t.Tipo_Movimento === 'Despesa' && t.Centro_Custo_Direcionado.includes('Rateio'))
    .reduce((acc, t) => acc + t.Valor_Total, 0)

  const totalHeadCount = state.animais.filter((a) => a.status === 'Ativo').length
  const custoFixoProporcional = totalHeadCount > 0 ? (fixedCosts / totalHeadCount) * qtd : 0

  const custoTotalAcumulado = custoVariavel + custoFixoProporcional

  const arrobasProduced = ganhoTotal / 30
  const custoPorArroba =
    arrobasProduced > 0 ? (custoTotalAcumulado / arrobasProduced).toFixed(2) : '0.00'

  const consumptionMap: Record<string, { name: string; qtd: number; unit: string; cost: number }> =
    {}
  lotManejos.forEach((m) => {
    if (m.itemId && m.quantity) {
      const insumo = state.estoque.find((e) => e.id === m.itemId)
      if (insumo) {
        if (!consumptionMap[insumo.id]) {
          consumptionMap[insumo.id] = { name: insumo.name, qtd: 0, unit: insumo.unit, cost: 0 }
        }
        consumptionMap[insumo.id].qtd += m.quantity
        consumptionMap[insumo.id].cost += m.cost || 0
      }
    }
  })

  const html = `
    <div class="header">
      <div class="logo">${logoSvg} TORIBA AGROPECUÁRIA</div>
      <div style="margin-left: auto; text-align: right;">
        <h2 style="margin:0;">Performance do Lote</h2>
        <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">Relatório Gerado em: ${new Date().toLocaleString()}</p>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h3>Informações do Lote</h3>
        <p><strong>Nome:</strong> ${lote.name}</p>
        <p><strong>Centro de Custo:</strong> ${lote.costCenter}</p>
        <p><strong>Piquete Atual:</strong> ${pasto ? pasto.name : 'Nenhum'}</p>
        <p><strong>Quantidade de Cabeças:</strong> ${qtd}</p>
      </div>
      <div class="card">
        <h3>Métricas Zootécnicas</h3>
        <p><strong>Peso Médio Atual:</strong> ${pesoMedio} kg</p>
        <p><strong>Ganho de Peso Total:</strong> ${ganhoTotal} kg (${arrobasProduced.toFixed(1)} @)</p>
        <p><strong>GMD Médio do Lote:</strong> ${gmdMedio} kg/dia</p>
      </div>
    </div>

    <div class="grid" style="margin-top: 20px;">
      <div class="card">
        <h3>Análise Financeira (Custo Acumulado)</h3>
        <p><strong>Custo Nutrição/Sanidade (Variável):</strong> R$ ${custoVariavel.toFixed(2)}</p>
        <p><strong>Custo Fixo Rateado:</strong> R$ ${custoFixoProporcional.toFixed(2)}</p>
        <hr style="border-top: 1px dashed #cbd5e1; margin: 10px 0;" />
        <p style="font-size: 18px;"><strong>Custo Total:</strong> R$ ${custoTotalAcumulado.toFixed(2)}</p>
        <p style="font-size: 18px; color: #094016;"><strong>Custo por @ Produzida:</strong> R$ ${custoPorArroba}</p>
      </div>
      <div class="card">
        <h3>Consumo de Insumos</h3>
        <table>
          <thead>
            <tr>
              <th>Insumo</th>
              <th class="text-right">Qtd</th>
              <th class="text-right">Custo</th>
            </tr>
          </thead>
          <tbody>
            ${
              Object.values(consumptionMap).length > 0
                ? Object.values(consumptionMap)
                    .map(
                      (c) => `
                  <tr>
                    <td>${c.name}</td>
                    <td class="text-right">${c.qtd} ${c.unit}</td>
                    <td class="text-right">R$ ${c.cost.toFixed(2)}</td>
                  </tr>
                `,
                    )
                    .join('')
                : '<tr><td colspan="3" class="text-center">Nenhum consumo registrado.</td></tr>'
            }
          </tbody>
        </table>
      </div>
    </div>
    
    <h3 style="margin-top: 30px;">Composição do Lote (Top 20 Animais por GMD)</h3>
    <table>
      <thead>
        <tr>
          <th>Brinco</th>
          <th>Nome/RGN</th>
          <th>Categoria</th>
          <th class="text-right">Peso (Kg)</th>
          <th class="text-right">GMD</th>
          <th class="text-right">Custo Ind.</th>
        </tr>
      </thead>
      <tbody>
        ${
          animaisLote.length > 0
            ? [...animaisLote]
                .sort((a, b) => b.gmd - a.gmd)
                .slice(0, 20)
                .map(
                  (a) => `
              <tr>
                <td><strong>${a.brinco}</strong></td>
                <td>${a.nomeAnimal || '-'}<br/><span style="font-size:10px;color:#64748b;">${a.rgn || ''}</span></td>
                <td>${a.categoria}</td>
                <td class="text-right font-mono">${a.pesoAtual}</td>
                <td class="text-right font-mono">${a.gmd.toFixed(3)}</td>
                <td class="text-right font-mono">R$ ${(a.custoAcumulado || 0).toFixed(2)}</td>
              </tr>
            `,
                )
                .join('')
            : `<tr><td colspan="6" class="text-center">Lote sem animais ativos.</td></tr>`
        }
      </tbody>
    </table>
  `
  await printPDF(`Relatorio_Lote_${lote.name.replace(/\s+/g, '_')}`, html)
}
