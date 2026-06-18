import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldCheck, UserX } from 'lucide-react'

export default function Solicitacoes() {
  const [users, setUsers] = useState<any[]>([])
  const { toast } = useToast()

  const loadUsers = async () => {
    try {
      const res = await pb.collection('users').getFullList({
        filter: "status_usuario = 'Inativo' || status_usuario = 'Pendente'",
        sort: '-created',
      })
      setUsers(res)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleApprove = async (userId: string, role: string) => {
    try {
      await pb.collection('users').update(userId, {
        status_usuario: 'Ativo',
        role: role === 'Admin' ? 'Admin' : 'Operacional',
        nivel_acesso: role || 'Operacional',
      })
      toast({ title: 'Usuário aprovado com sucesso!' })
      loadUsers()
    } catch (err: any) {
      toast({ title: 'Erro ao aprovar', description: err.message, variant: 'destructive' })
    }
  }

  const handleReject = async (userId: string) => {
    try {
      await pb.collection('users').delete(userId)
      toast({ title: 'Solicitação rejeitada.' })
      loadUsers()
    } catch (err: any) {
      toast({ title: 'Erro ao rejeitar', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-serif text-[#10213d]">Solicitações de Acesso</h1>
        <p className="text-slate-500 mt-1">Gerencie os acessos pendentes ao sistema.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.length === 0 ? (
          <div className="col-span-full text-slate-500 py-12 text-center bg-white rounded-xl border border-dashed">
            Nenhuma solicitação pendente no momento.
          </div>
        ) : (
          users.map((u) => (
            <Card key={u.id} className="shadow-sm">
              <CardHeader className="pb-2 border-b mb-4">
                <CardTitle className="text-lg font-serif">{u.name}</CardTitle>
                <div className="text-sm text-slate-500">{u.email}</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <span className="font-medium text-slate-700">Documento/CPF:</span> <br />
                  {u.phone || 'Não informado'}
                </div>
                <div className="text-sm">
                  <span className="font-medium text-slate-700">Perfil Solicitado:</span> <br />
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {u.role || 'Operacional'}
                  </span>
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  <Button
                    onClick={() => handleApprove(u.id, u.role || 'Operacional')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" /> Aprovar Acesso
                  </Button>
                  <Button
                    onClick={() => handleReject(u.id)}
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
                  >
                    <UserX className="w-4 h-4 mr-2" /> Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
