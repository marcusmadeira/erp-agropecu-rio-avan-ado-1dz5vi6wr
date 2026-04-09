import { Button } from '@/components/ui/button'
import { FileText, FileSpreadsheet } from 'lucide-react'

interface ExportButtonsProps {
  onExportPDF: () => void
  onExportExcel: () => void
}

export function ExportButtons({ onExportPDF, onExportExcel }: ExportButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={onExportPDF}
        size="sm"
        className="bg-slate-900 hover:bg-slate-800 text-white border border-black shadow-sm transition-all"
      >
        <FileText className="w-4 h-4 mr-2" /> Exportar PDF
      </Button>
      <Button
        onClick={onExportExcel}
        size="sm"
        className="bg-slate-900 hover:bg-slate-800 text-white border border-black shadow-sm transition-all"
      >
        <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar Excel
      </Button>
    </div>
  )
}
