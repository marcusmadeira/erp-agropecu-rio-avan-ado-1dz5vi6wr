import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export interface ExportColumn {
  header: string
  dataKey: string | ((row: any) => string | number)
}

export interface ExportOptions {
  title: string
  data: any[]
  columns: ExportColumn[]
  userName: string
}

const getFormattedDate = () => {
  const now = new Date()
  return `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

const processData = (data: any[], columns: ExportColumn[]) => {
  return data.map((row) => {
    const processedRow: any = {}
    columns.forEach((col) => {
      if (typeof col.dataKey === 'function') {
        processedRow[col.header] = col.dataKey(row)
      } else {
        processedRow[col.header] = row[col.dataKey]
      }
    })
    return processedRow
  })
}

export function exportToPDF({ title, data, columns, userName }: ExportOptions) {
  const doc = new jsPDF()
  const timestamp = getFormattedDate()
  const safeUserName = userName || 'Desconhecido'

  doc.setFontSize(16)
  doc.text(title, 14, 20)

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Relatório gerado em: ${timestamp}`, 14, 30)
  doc.text(`Usuário: ${safeUserName}`, 14, 36)

  const head = [columns.map((c) => c.header)]
  const body = data.map((row) =>
    columns.map((c) => {
      if (typeof c.dataKey === 'function') return c.dataKey(row) ?? '-'
      return row[c.dataKey] ?? '-'
    }),
  )

  autoTable(doc, {
    startY: 45,
    head,
    body,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 8 },
  })

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`)
}

export function exportToExcel({ title, data, columns, userName }: ExportOptions) {
  const timestamp = getFormattedDate()
  const safeUserName = userName || 'Desconhecido'

  const processed = processData(data, columns)

  const wsData = [
    [title],
    [`Relatório gerado em: ${timestamp}`],
    [`Usuário: ${safeUserName}`],
    [],
    columns.map((c) => c.header),
    ...data.map((row) =>
      columns.map((c) => {
        if (typeof c.dataKey === 'function') return c.dataKey(row) ?? '-'
        return row[c.dataKey] ?? '-'
      }),
    ),
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Dados')

  XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}.xlsx`)
}
