import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { Plus, Search, ChevronDown, ChevronUp, Save, Star } from 'lucide-react'
import ParceiroForm from '@/pages/cadastros/ParceiroForm'

export default function TabClientesCRM() {
  const [clientes, setClientes] = useState<any[]>([])
  const [vendas, setVendas] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const { toast } = useToast()

  const fetchClientes = async () => {
    try {
      setLoading(true)
      const records = await pb.collection('parceiros_negocios').getFullList({
        filter: "categoria_parceiro = 'Cliente' || categoria_parceiro = ''",
        sort: '-created',
      })
      setClientes(records)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClientes()
  }, [])

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    if (!vendas[id]) {
      try {
        const history = await pb.collection('vendas').getFullList({
          filter: `cliente_id = '${id}'`,
          sort: '-data_venda',
        })
        setVendas((prev) => ({ ...prev, [id]: history }))
      } catch (e) {
        console.error(e)
      }
    }
  }

  const handleUpdateSerasa = async (id: string, score: string) => {
    try {
      await pb.collection('parceiros_negocios').update(id, { nota_serasa: Number(score) })
      toast({ title: 'Nota Serasa atualizada com sucesso!' })
      fetchClientes()
    } catch (e) {
      toast({ title: 'Erro ao atualizar nota', variant: 'destructive' })
    }
  }

  const filteredClientes = clientes.filter(
    (c) =>
      c.nome_razao_social?.toLowerCase().includes(search.toLowerCase()) ||
      (c.numero_documento && c.numero_documento.includes(search)),
  )

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por nome ou CPF..."
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          className="w-full sm:w-auto text-white shadow-md transition-transform active:scale-95"
          style={{ backgroundColor: '#094016' }}
          onClick={() => {
            setSelectedClient(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> Adicionar Cliente
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-emerald-50/50 text-emerald-900 border-b border-gray-200">
            <tr>
              <th className="p-4 text-left font-semibold">Nome do Cliente</th>
              <th className="p-4 text-left font-semibold">Documento (CPF)</th>
              <th className="p-4 text-left font-semibold">Contato</th>
              <th className="p-4 text-center font-semibold">Status de Crédito</th>
              <th className="p-4 text-center font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredClientes.map((cliente) => {
              const isApto = !!(cliente.numero_documento && cliente.rg)
              const isExpanded = expandedId === cliente.id

              return (
                <React.Fragment key={cliente.id}>
                  <tr
                    className={`transition-colors ${isExpanded ? 'bg-emerald-50/10' : 'hover:bg-gray-50/80'}`}
                  >
                    <td className="p-4 font-medium text-gray-900">{cliente.nome_razao_social}</td>
                    <td className="p-4 text-gray-600">{cliente.numero_documento || '-'}</td>
                    <td className="p-4 text-gray-600">
                      {cliente.contato_whatsapp || cliente.email || '-'}
                    </td>
                    <td className="p-4 text-center">
                      <Badge
                        variant={isApto ? 'default' : 'secondary'}
                        className={
                          isApto
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200'
                            : 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200'
                        }
                      >
                        {isApto ? 'Apto' : 'Incompleto'}
                      </Badge>
                    </td>
                    <td className="p-4 text-center space-x-2 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedClient(cliente)
                          setFormOpen(true)
                        }}
                      >
                        Editar
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => toggleExpand(cliente.id)}>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-emerald-50/20 border-b border-gray-200">
                      <td colSpan={5} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Serasa Score */}
                          <Card className="shadow-sm border-gray-200 bg-white h-full">
                            <CardHeader className="py-4 border-b border-gray-100 bg-gray-50/50">
                              <CardTitle className="text-base font-semibold text-gray-800 flex items-center">
                                <Star className="w-4 h-4 mr-2 text-yellow-500 fill-yellow-500" />
                                Análise de Crédito
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                              <div className="flex items-end gap-3">
                                <div className="space-y-2 flex-1">
                                  <label className="text-sm font-medium text-gray-700">
                                    Nota SERASA Manual
                                  </label>
                                  <Input
                                    type="number"
                                    placeholder="Ex: 850"
                                    defaultValue={cliente.nota_serasa || ''}
                                    id={`serasa-${cliente.id}`}
                                    className="max-w-xs"
                                  />
                                </div>
                                <Button
                                  variant="default"
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={() => {
                                    const val = (
                                      document.getElementById(
                                        `serasa-${cliente.id}`,
                                      ) as HTMLInputElement
                                    ).value
                                    handleUpdateSerasa(cliente.id, val)
                                  }}
                                >
                                  <Save className="h-4 w-4 mr-2" /> Salvar Nota
                                </Button>
                              </div>
                              {!isApto && (
                                <div className="mt-6 p-3 rounded-md bg-orange-50 border border-orange-100 text-sm text-orange-800 flex flex-col gap-1">
                                  <span className="font-semibold text-orange-900">
                                    Documentação Incompleta!
                                  </span>
                                  <span>
                                    O cliente não possui RG ou CPF cadastrados. Vendas na modalidade
                                    "Parcelado" serão bloqueadas pelo sistema.
                                  </span>
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Purchase History */}
                          <Card className="shadow-sm border-gray-200 bg-white h-full">
                            <CardHeader className="py-4 border-b border-gray-100 bg-gray-50/50">
                              <CardTitle className="text-base font-semibold text-gray-800">
                                Histórico de Compras
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 p-4">
                              {vendas[cliente.id] === undefined ? (
                                <div className="flex justify-center py-8">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-800"></div>
                                </div>
                              ) : vendas[cliente.id].length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                  <p className="text-sm">
                                    Nenhuma compra registrada para este cliente.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                  {vendas[cliente.id].map((v: any) => (
                                    <div
                                      key={v.id}
                                      className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-md border border-gray-100 transition-colors hover:bg-gray-100"
                                    >
                                      <div>
                                        <span className="font-semibold text-gray-900 block">
                                          {new Date(v.data_venda).toLocaleDateString('pt-BR')}
                                        </span>
                                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                                          {v.status_venda}
                                        </span>
                                      </div>
                                      <div className="text-right flex flex-col items-end">
                                        <span className="font-bold text-emerald-700 block">
                                          R$ {v.valor_total_venda?.toFixed(2)}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] py-0 mt-1 font-normal bg-white"
                                        >
                                          {v.forma_pagamento}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
            {filteredClientes.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-16 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <div className="bg-gray-100 p-4 rounded-full mb-3">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-600">Nenhum cliente encontrado</p>
                    <p className="text-sm mt-1">
                      Tente ajustar seus termos de busca ou crie um novo registro.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ParceiroForm
        open={formOpen}
        onOpenChange={(open: boolean) => {
          setFormOpen(open)
          if (!open) fetchClientes()
        }}
        item={selectedClient}
      />
    </div>
  )
}
