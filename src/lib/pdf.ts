import { Animal, Lote, AppState } from '@/stores/types'

function printPDF(title: string, html: string) {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #064e3b; margin: 0; padding: 20px; }
          h1, h2, h3 { color: #065f46; }
          .header { display: flex; align-items: center; border-bottom: 2px solid #059669; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { background: #d1fae5; color: #065f46; padding: 10px 15px; border-radius: 8px; font-weight: bold; font-size: 24px; margin-right: 20px; letter-spacing: -0.5px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .card { border: 1px solid #d1fae5; padding: 15px; border-radius: 8px; background: #f8fafc; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
          th { background-color: #ecfdf5; text-align: left; padding: 10px; border: 1px solid #d1fae5; }
          td { padding: 10px; border: 1px solid #e5e7eb; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background: #d1fae5; color: #065f46; }
        </style>
      </head>
      <body onload="window.print(); setTimeout(() => window.close(), 500);">
        ${html}
      </body>
    </html>
  `)
  win.document.close()
}

export function exportAnimalPDF(animal: Animal, state: AppState) {
  const lote = state.lotes.find((l) => l.id === animal.loteId)
  const pai = state.animais.find((a) => a.id === animal.pai)
  const mae = state.animais.find((a) => a.id === animal.mae)

  const history = state.pesagens
    .filter((p) => p.animalId === animal.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const reproHistory = state.reproducoes
    .filter((r) => r.animalId === animal.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Generate simple ASCII bar chart for GMD progress
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
            <div style="width: ${width}%; background: #10b981; height: 100%;"></div>
          </div>
          <div style="width: 50px; text-align: right; font-weight: bold;">${h.weight}kg</div>
        </div>
      `
      })
      .join('')
  }

  const html = `
    <div class="header">
      <div class="logo">AGRO ERP</div>
      <div>
        <h1 style="margin:0;">Ficha Individual (Dossiê)</h1>
        <p style="margin: 5px 0 0 0; color: #64748b;">Relatório Gerado em: ${new Date().toLocaleString()}</p>
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

    <div class="card" style="margin-top: 20px;">
      <h3>Genealogia (Pedigree)</h3>
      <p><strong>Pai:</strong> ${pai ? `${pai.nomeAnimal || ''} (${pai.brinco}) - ${pai.rgn || 'S/RGN'}` : 'Desconhecido'}</p>
      <p><strong>Mãe:</strong> ${mae ? `${mae.nomeAnimal || ''} (${mae.brinco}) - ${mae.rgn || 'S/RGN'}` : 'Desconhecida'}</p>
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
                  <td><span class="badge" style="background:#fef3c7;color:#92400e;">${r.status}</span></td>
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
  printPDF(`Ficha_${animal.brinco}`, html)
}

export function exportLotePDF(lote: Lote, state: AppState) {
  const animaisLote = state.animais.filter((a) => a.loteId === lote.id && a.status === 'Ativo')
  const qtd = animaisLote.length

  const pesoInicial = animaisLote.reduce((acc, a) => acc + (a.pesoEntrada || a.pesoAtual), 0)
  const pesoFinal = animaisLote.reduce((acc, a) => acc + a.pesoAtual, 0)
  const ganhoTotal = pesoFinal - pesoInicial

  const pesoMedio = qtd > 0 ? (pesoFinal / qtd).toFixed(1) : '0.0'
  const gmdMedio =
    qtd > 0 ? (animaisLote.reduce((acc, a) => acc + a.gmd, 0) / qtd).toFixed(3) : '0.000'

  const pasto = state.pastos.find((p) => p.loteId === lote.id)

  // Calc Consumption and Costs
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

  // Aggregate consumed insumos
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
      <div class="logo">AGRO ERP</div>
      <div>
        <h1 style="margin:0;">Performance do Lote</h1>
        <p style="margin: 5px 0 0 0; color: #64748b;">Relatório Gerado em: ${new Date().toLocaleString()}</p>
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
        <hr style="border-top: 1px dashed #d1fae5; margin: 10px 0;" />
        <p style="font-size: 18px;"><strong>Custo Total:</strong> R$ ${custoTotalAcumulado.toFixed(2)}</p>
        <p style="font-size: 18px; color: #047857;"><strong>Custo por @ Produzida:</strong> R$ ${custoPorArroba}</p>
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
              </tr>
            `,
                )
                .join('')
            : `<tr><td colspan="5" class="text-center">Lote sem animais ativos.</td></tr>`
        }
      </tbody>
    </table>
  `
  printPDF(`Relatorio_Lote_${lote.name.replace(/\s+/g, '_')}`, html)
}
