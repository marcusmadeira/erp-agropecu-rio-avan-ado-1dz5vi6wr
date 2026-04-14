import { useEffect, useState, useMemo } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Phone, Mail } from 'lucide-react'

export default function TabClientesCRM() {
  const [clientes, setClientes] = useState<any[]>([])
  const [vendas, setVendas] = useState<any[]>([])
  const [boletos, setBoletos] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      pb
        .collection('parceiros_negocios')
        .getFullList({ filter: "categoria_parceiro = 'Cliente' || tipo_cliente != ''" }),
      pb.collection('vendas').getFullList(),
      pb.collection('boletos').getFullList({ expand: 'venda_id,venda_id.cliente_id' }),
    ]).then(([cli, ven, bol]) => {
      setClientes(cli)
      setVendas(ven)
      setBoletos(bol)
    })
  }, [])

  const crmData = useMemo(() => {
    return clientes
      .map((c) => {
        const cliVendas = vendas.filter((v) => v.cliente_id === c.id)
        const cliBoletos = boletos.filter(
          (b) =>
            b.expand?.venda_id?.cliente_id === c.id ||
            b.expand?.venda_id?.expand?.cliente_id?.id === c.id,
        )

        const ltv = cliVendas.reduce((acc, v) => acc + (v.valor_total_venda || 0), 0)
        const debt = cliBoletos
          .filter((b) => b.status_boleto !== 'Pago' && b.status_boleto !== 'Cancelado')
          .reduce((acc, b) => acc + (b.valor_boleto || 0), 0)

        return { ...c, totalVendas: cliVendas.length, ltv, debt }
      })
      .filter((c) => c.nome_razao_social.toLowerCase().includes(search.toLowerCase()))
  }, [clientes, vendas, boletos, search])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-md border border-gray-200">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {crmData.map((c) => (
          <Card key={c.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3
                    className="font-bold text-gray-900 truncate max-w-[200px]"
                    title={c.nome_razao_social}
                  >
                    {c.nome_razao_social}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {c.tipo_cliente === 'Pessoa_Juridica' ? 'PJ' : 'PF'} -{' '}
                    {c.numero_documento || 'Sem doc'}
                  </p>
                </div>
                <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded">
                  {c.totalVendas} Vendas
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <Phone className="w-3 h-3 mr-2" /> {c.contato_whatsapp || 'Não informado'}
                </div>
                <div className="flex items-center">
                  <Mail className="w-3 h-3 mr-2" /> {c.email || 'Não informado'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                <div>
                  <p className="text-xs text-gray-500">LTV (Volume)</p>
                  <p className="font-bold text-gray-800">R$ {c.ltv.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Saldo Devedor</p>
                  <p className={`font-bold ${c.debt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    R$ {c.debt.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {crmData.length === 0 && <p className="text-gray-500 p-4">Nenhum cliente encontrado.</p>}
      </div>
    </div>
  )
}
