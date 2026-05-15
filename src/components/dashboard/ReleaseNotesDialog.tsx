import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle2, FileText, Download } from 'lucide-react'

export default function ReleaseNotesDialog() {
  const [open, setOpen] = useState(false)

  const points = [
    'Reproduction and Birth modules stabilized.',
    'Herd Core management (Rebanho) fully homologated.',
    'Weighing, Inventory, and Performance modules homologated.',
    'Sales, Receipts, and historical traceability homologated.',
    'Expenses, Accounts Payable, and Financial Dashboard homologated.',
    'Stock, Feed Recipes, Production, and Feed Output homologated.',
    'Diagnosis, Goals, Simulator, Market, and Weather modules homologated.',
    'Imports, OCR processing, and Audit logs homologated.',
    'Final publication review completed.',
    'System published and accessible at https://sistema.toribaagropecuaria.com.',
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-[#094016] text-white hover:bg-[#094016]/90 border-0"
        >
          <FileText className="w-4 h-4 mr-2" /> Release Candidate 1
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-white max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl text-[#094016] flex items-center gap-2">
            <Download className="w-6 h-6" />
            Release Candidata 1 - Auditoria Geral Concluída
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            <div className="bg-emerald-50 text-emerald-900 p-4 rounded-lg text-sm border border-emerald-200">
              <h4 className="font-bold mb-2">Resumo da Versão</h4>
              <p>
                O ERP Agropecuário Avançado Toriba concluiu com sucesso a sua fase de auditoria
                geral. Todos os 28 módulos solicitados operam em conformidade com as regras de
                negócio e estão prontos para dados de produção.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
                Changelog & Homologação
              </h3>
              <ul className="space-y-3">
                {points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700 text-sm">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
