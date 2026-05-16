import pb from '@/lib/pocketbase/client'
import localLogo from '@/assets/whatsapp-image-2026-03-16-at-16.52.11-c60ad.jpeg'

const logoSvg = `
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:40px;height:40px;margin-right:15px;vertical-align:middle;">
    <circle cx="50" cy="50" r="50" fill="#094016" />
    <path d="M44 28 C44 24.686 46.686 22 50 22 C53.314 22 56 24.686 56 28 L56 72 C56 75.314 53.314 78 50 78 C46.686 78 44 75.314 44 72 L44 28 Z" fill="white" />
    <path d="M24 35 C24 31 18 31 18 35 C18 55 28 68 36 74 C38 75.5 41 72 39 70 C32 65 24 53 24 35 Z" fill="white" />
    <path d="M76 35 C76 31 82 31 82 35 C82 55 72 68 64 74 C62 75.5 59 72 61 70 C68 65 76 53 76 35 Z" fill="white" />
  </svg>
`

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

export async function exportFechamentoEconomicoPDF(data: any[], filters: any) {
  const win = window.open('', '_blank')
  if (!win) return

  const logoUrl = await getActiveLogoUrl()
  const absoluteLogoUrl =
    logoUrl.startsWith('http') || logoUrl.startsWith('data:')
      ? logoUrl
      : window.location.origin + (logoUrl.startsWith('/') ? '' : '/') + logoUrl

  const totais = data.reduce(
    (acc, lote) => {
      acc.receita += lote.receita_total
      acc.custo += lote.custo_total
      acc.margem += lote.margem_bruta
      acc.cabecas += lote.quantidade_cabecas
      acc.arrobas += lote.arrobas_produzidas
      return acc
    },
    { receita: 0, custo: 0, margem: 0, cabecas: 0, arrobas: 0 },
  )

  const mediaCustoArroba = totais.arrobas > 0 ? totais.custo / totais.arrobas : 0

  const html = `
    <html>
      <head>
        <title>Fechamento Econômico</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #000000; margin: 0; padding: 20px; }
          h1, h2, h3 { color: #094016; margin-top: 0; }
          .header { display: flex; align-items: center; border-bottom: 2px solid #094016; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { display: flex; align-items: center; font-weight: bold; font-size: 28px; margin-right: 20px; letter-spacing: -0.5px; color: #094016; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background: #f8fafc; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th { background-color: #f1f5f9; text-align: left; padding: 10px; border: 1px solid #e2e8f0; color: #094016; }
          td { padding: 8px 10px; border: 1px solid #e2e8f0; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: #e2e8f0; color: #094016; }
          .footer { margin-top: 40px; border-top: 2px solid #094016; padding-top: 20px; display: flex; align-items: flex-start; page-break-inside: avoid; }
          .footer-logo { width: 64px; height: 64px; object-fit: contain; flex-shrink: 0; }
          .footer-text { margin-left: 15px; font-size: 12px; color: #64748b; }
          .footer-text-brand { margin: 0; font-weight: bold; color: #094016; }
          .footer-text-p { margin: 0; }
          .positive { color: #059669; }
          .negative { color: #dc2626; }
        </style>
      </head>
      <body onload="setTimeout(() => { window.print(); setTimeout(() => window.close(), 500); }, 500);">
        
        <div class="header">
          <div class="logo">${logoSvg} TORIBA AGROPECUÁRIA</div>
          <div style="margin-left: auto; text-align: right;">
            <h2 style="margin:0;">Fechamento Econômico (Ciclo)</h2>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">Gerado em: ${new Date().toLocaleString()}</p>
          </div>
        </div>

        <div class="card" style="margin-bottom: 20px;">
          <h3>Resumo Global (Filtros: Status = ${filters.statusFilter || 'Todos'}, CC = ${filters.ccFilter || 'Todos'})</h3>
          <div style="display: flex; gap: 40px;">
            <div>
              <p style="margin: 5px 0; font-size: 12px; color: #64748b;">Receita Total</p>
              <p style="margin: 0; font-size: 18px; font-weight: bold;" class="positive">R$ ${totais.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p style="margin: 5px 0; font-size: 12px; color: #64748b;">Custo Total</p>
              <p style="margin: 0; font-size: 18px; font-weight: bold;" class="negative">R$ ${totais.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p style="margin: 5px 0; font-size: 12px; color: #64748b;">Margem Global</p>
              <p style="margin: 0; font-size: 18px; font-weight: bold;" class="${totais.margem >= 0 ? 'positive' : 'negative'}">R$ ${totais.margem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p style="margin: 5px 0; font-size: 12px; color: #64748b;">Custo Médio / @</p>
              <p style="margin: 0; font-size: 18px; font-weight: bold;">R$ ${mediaCustoArroba.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Lote</th>
              <th>Status</th>
              <th class="text-right">Cab.</th>
              <th class="text-right">@ Prod.</th>
              <th class="text-right">Custo / @</th>
              <th class="text-right">Margem / Cab.</th>
              <th class="text-right">Margem Total</th>
            </tr>
          </thead>
          <tbody>
            ${
              data.length > 0
                ? data
                    .map(
                      (lote) => `
              <tr>
                <td>
                  <strong>${lote.nome_lote}</strong><br>
                  <span style="font-size: 10px; color: #64748b;">${lote.centro_custo || 'S/ CC'}</span>
                </td>
                <td><span class="badge">${lote.status || 'Ativo'}</span></td>
                <td class="text-right">${lote.quantidade_cabecas}</td>
                <td class="text-right">${lote.arrobas_produzidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td class="text-right negative">${lote.custo_por_arroba > 0 ? 'R$ ' + lote.custo_por_arroba.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'N/A'}</td>
                <td class="text-right ${lote.margem_por_cabeca >= 0 ? 'positive' : 'negative'}">${lote.margem_por_cabeca !== 0 ? 'R$ ' + lote.margem_por_cabeca.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'N/A'}</td>
                <td class="text-right ${lote.margem_bruta >= 0 ? 'positive' : 'negative'}"><strong>R$ ${lote.margem_bruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
              </tr>
            `,
                    )
                    .join('')
                : '<tr><td colspan="7" class="text-center">Nenhum lote encontrado.</td></tr>'
            }
          </tbody>
        </table>

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
  `
  win.document.write(html)
  win.document.close()
}
