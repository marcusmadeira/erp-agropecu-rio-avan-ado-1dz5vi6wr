import { useState, useEffect } from 'react'
import { getBoletosExpanded, enviarBoletoEmail } from '@/services/vendas_gestao'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Mail, MessageCircle } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { ModalNovoBoleto } from './ModalNovoBoleto'

export default function TabBoletos() {
  const [boletos, setBoletos] = useState<any[]>([])
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [openModal, setOpenModal] = useState(false)
  const { toast } = useToast()

  const load = async () => getBoletosExpanded().then(setBoletos).catch(console.error)
  useEffect(() => {
    load()
  }, [])
  useRealtime('boletos', load)

  const filtrados = boletos.filter(
    (b) => filtroStatus === 'Todos' || b.status_boleto === filtroStatus,
  )

  const handleWhatsApp = (boleto: any) => {
    const phone = boleto.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id?.contato_whatsapp
    if (!phone) return toast({ title: 'Cliente sem WhatsApp cadastrado', variant: 'destructive' })
    const val = boleto.valor_boleto
    const data = format(new Date(boleto.data_vencimento), 'dd/MM/yyyy')
    const msg = `Olá! Lembrete do boleto de R$ ${val}, vencimento ${data}. Cód: ${boleto.numero_boleto}`
    window.open(
      `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`,
      '_blank',
    )
  }

  const handleEmail = async (id: string) => {
    try {
      await enviarBoletoEmail(id)
      toast({ title: 'Email enviado com sucesso!' })
      load()
    } catch (e) {
      toast({ title: 'Erro ao enviar email', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-md border border-gray-200">
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-48 bg-white border-gray-300">
            <SelectValue placeholder="Filtrar por Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os Status</SelectItem>
            <SelectItem value="Gerado">Gerado</SelectItem>
            <SelectItem value="Enviado">Enviado</SelectItem>
            <SelectItem value="Pago">Pago</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => setOpenModal(true)}
          className="bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" /> Gerar Novo Boleto
        </Button>
      </div>
      <div className="border border-gray-200 rounded-md overflow-x-auto bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 border-b border-gray-200 text-black">
            <tr>
              <th className="p-4 font-semibold">Cliente</th>
              <th className="p-4 font-semibold">Número</th>
              <th className="p-4 font-semibold">Valor</th>
              <th className="p-4 font-semibold">Vencimento</th>
              <th className="p-4 font-semibold">Status / Atraso</th>
              <th className="p-4 font-semibold text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((b) => {
              const dias =
                b.status_boleto !== 'Pago'
                  ? differenceInDays(new Date(), new Date(b.data_vencimento))
                  : 0
              return (
                <tr
                  key={b.id}
                  className="border-b border-gray-100 hover:bg-gray-50 text-black transition-colors"
                >
                  <td className="p-4 font-medium">
                    {b.expand?.parcela_id?.expand?.venda_id?.expand?.cliente_id
                      ?.nome_razao_social || '-'}
                  </td>
                  <td className="p-4 font-mono text-xs text-gray-500">{b.numero_boleto}</td>
                  <td className="p-4 text-emerald-700 font-bold">
                    R$ {b.valor_boleto?.toLocaleString('pt-BR')}
                  </td>
                  <td className="p-4">{format(new Date(b.data_vencimento), 'dd/MM/yyyy')}</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-gray-200 text-xs rounded-full">
                        {b.status_boleto}
                      </span>
                      {dias > 0 && (
                        <span className="text-red-600 text-xs font-bold">{dias} dias</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEmail(b.id)}
                      title="Enviar por Email"
                      className="border-gray-300 text-emerald-800"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleWhatsApp(b)}
                      title="Cobrar WhatsApp"
                      className="border-gray-300 text-green-600"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              )
            })}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  Nenhum boleto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ModalNovoBoleto open={openModal} onOpenChange={setOpenModal} onSuccess={load} />
    </div>
  )
}
