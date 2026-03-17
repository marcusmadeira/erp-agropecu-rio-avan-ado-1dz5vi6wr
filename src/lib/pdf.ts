import { Animal, Lote, Pasto, Pesagem } from '@/stores/types'

function printPDF(title: string, html: string) {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
      </head>
      <body onload="window.print(); setTimeout(() => window.close(), 500);">
        ${html}
      </body>
    </html>
  `)
  win.document.close()
}

export function exportAnimalPDF(
  animal: Animal,
  lotes: Lote[],
  pesagens: Pesagem[],
  todosAnimais: Animal[],
) {
  const lote = lotes.find((l) => l.id === animal.loteId)
  const pai = todosAnimais.find((a) => a.id === animal.pai)
  const mae = todosAnimais.find((a) => a.id === animal.mae)
  const history = pesagens
    .filter((p) => p.animalId === animal.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #064e3b;">
      <h1 style="border-bottom: 2px solid #059669; padding-bottom: 10px;">Ficha Individual do Animal</h1>
      <div style="margin-top: 20px; font-size: 16px; line-height: 1.6;">
        <p><strong>Brinco (ID Manejo):</strong> ${animal.brinco}</p>
        <p><strong>RGN/RGD ABCZ:</strong> ${animal.rgn || 'N/A'}</p>
        <p><strong>Categoria:</strong> ${animal.categoria}</p>
        <p><strong>Status:</strong> ${animal.status}</p>
        <p><strong>Lote Atual:</strong> ${lote ? lote.name : 'Sem Lote'}</p>
        <p><strong>Centro de Custo:</strong> ${animal.costCenter}</p>
        <p><strong>Genealogia:</strong> Pai: ${pai ? pai.brinco : 'Desconhecido'} | Mãe: ${mae ? mae.brinco : 'Desconhecida'}</p>
        <p><strong>Peso de Entrada:</strong> ${animal.pesoEntrada || '-'} kg</p>
        <p><strong>Peso Atual:</strong> ${animal.pesoAtual} kg</p>
      </div>
      
      <h3 style="margin-top: 30px;">Histórico de Pesagem</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background-color: #ecfdf5; text-align: left;">
            <th style="padding: 10px; border: 1px solid #d1fae5;">Data do Registro</th>
            <th style="padding: 10px; border: 1px solid #d1fae5;">Peso Registrado (Kg)</th>
          </tr>
        </thead>
        <tbody>
          ${
            history.length > 0
              ? history
                  .map(
                    (h) => `
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${new Date(h.date).toLocaleDateString()}</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-family: monospace;">${h.weight} kg</td>
            </tr>
          `,
                  )
                  .join('')
              : `<tr><td colspan="2" style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">Nenhum registro de pesagem encontrado.</td></tr>`
          }
        </tbody>
      </table>
    </div>
  `
  printPDF(`Ficha_${animal.brinco}`, html)
}

export function exportLotePDF(lote: Lote, animais: Animal[], pastos: Pasto[]) {
  const animaisLote = animais.filter((a) => a.loteId === lote.id && a.status === 'Ativo')
  const qtd = animaisLote.length
  const pesoMedio =
    qtd > 0 ? (animaisLote.reduce((acc, a) => acc + a.pesoAtual, 0) / qtd).toFixed(1) : '0.0'
  const gmdMedio =
    qtd > 0 ? (animaisLote.reduce((acc, a) => acc + a.gmd, 0) / qtd).toFixed(3) : '0.000'
  const pasto = pastos.find((p) => p.loteId === lote.id)

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #064e3b;">
      <h1 style="border-bottom: 2px solid #059669; padding-bottom: 10px;">Relatório de Desempenho do Lote</h1>
      <div style="margin-top: 20px; font-size: 16px; line-height: 1.6;">
        <p><strong>Nome do Lote:</strong> ${lote.name}</p>
        <p><strong>Centro de Custo:</strong> ${lote.costCenter}</p>
        <p><strong>Piquete Atual:</strong> ${pasto ? pasto.name : 'Nenhum'}</p>
        <p><strong>Quantidade de Cabeças:</strong> ${qtd}</p>
        <p><strong>Peso Médio:</strong> ${pesoMedio} kg</p>
        <p><strong>GMD Médio do Lote:</strong> ${gmdMedio} kg/dia</p>
      </div>
      
      <h3 style="margin-top: 30px;">Composição do Lote (${qtd} cabeças)</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
        <thead>
          <tr style="background-color: #ecfdf5; text-align: left;">
            <th style="padding: 10px; border: 1px solid #d1fae5;">Brinco</th>
            <th style="padding: 10px; border: 1px solid #d1fae5;">RGN/RGD</th>
            <th style="padding: 10px; border: 1px solid #d1fae5;">Categoria</th>
            <th style="padding: 10px; border: 1px solid #d1fae5;">Peso (Kg)</th>
            <th style="padding: 10px; border: 1px solid #d1fae5;">GMD</th>
          </tr>
        </thead>
        <tbody>
          ${
            animaisLote.length > 0
              ? animaisLote
                  .map(
                    (a) => `
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>${a.brinco}</strong></td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${a.rgn || '-'}</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${a.categoria}</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-family: monospace;">${a.pesoAtual}</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb; font-family: monospace;">${a.gmd.toFixed(3)}</td>
            </tr>
          `,
                  )
                  .join('')
              : `<tr><td colspan="5" style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">Lote sem animais ativos.</td></tr>`
          }
        </tbody>
      </table>
    </div>
  `
  printPDF(`Relatorio_Lote_${lote.name.replace(/\s+/g, '_')}`, html)
}
