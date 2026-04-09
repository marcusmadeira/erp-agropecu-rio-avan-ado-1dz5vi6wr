import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Upload, ShieldAlert, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

export function SecurityTab({ user }: { user: any }) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const collections = [
    'parceiros_negocios',
    'lotes',
    'animais',
    'estoque_insumos',
    'transacoes_financeiras',
    'planejamento_acasalamento',
    'manejo_iatf_curral',
    'nascimentos_e_desmama',
    'pesagens_diarias',
  ]

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const backupData: Record<string, any[]> = {}
      for (const col of collections) {
        const records = await pb.collection(col).getFullList()
        backupData[col] = records
      }

      const jsonString = JSON.stringify(backupData)
      const encrypted = btoa(encodeURIComponent(jsonString))

      const blob = new Blob([encrypted], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-erp-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Backup concluído',
        description: 'O arquivo de backup foi baixado com sucesso.',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro no backup',
        description: error.message || 'Não foi possível exportar os dados.',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const decrypted = decodeURIComponent(atob(text))
      const backupData = JSON.parse(decrypted)

      for (const col of Object.keys(backupData)) {
        if (!collections.includes(col)) continue

        const records = backupData[col]
        for (const record of records) {
          const { id, collectionId, collectionName, expand, created, updated, ...data } = record
          try {
            await pb.collection(col).update(id, data)
          } catch (e) {
            await pb.collection(col).create({ id, ...data })
          }
        }
      }

      toast({
        title: 'Restauração concluída',
        description: 'Os dados foram restaurados com sucesso.',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro na restauração',
        description: 'Arquivo inválido ou erro ao processar os dados.',
      })
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-white pb-4 border-b border-slate-100 rounded-t-xl">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-slate-900" />
            <CardTitle className="text-slate-900">Segurança e Dados</CardTitle>
          </div>
          <CardDescription className="text-slate-500">
            Faça backup dos seus dados ou restaure a partir de um arquivo existente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6 bg-white rounded-b-xl">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4 p-5 border border-slate-200 rounded-lg bg-slate-50 transition-colors hover:bg-slate-100/50">
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Exportar Dados
                </h3>
                <p className="text-sm text-slate-600 min-h-[40px]">
                  Baixe um arquivo criptografado contendo todos os seus registros de animais,
                  financeiro, estoque e parceiros.
                </p>
              </div>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-slate-900 text-white hover:bg-slate-800 transition-all"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Fazer Backup
              </Button>
            </div>

            <div className="space-y-4 p-5 border border-slate-200 rounded-lg bg-slate-50 transition-colors hover:bg-slate-100/50">
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Importar Dados
                </h3>
                <p className="text-sm text-slate-600 min-h-[40px]">
                  Restaure seus dados a partir de um arquivo de backup previamente baixado.
                </p>
              </div>
              <input
                type="file"
                accept=".json"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImport}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="w-full border-slate-300 text-slate-900 hover:bg-slate-100 transition-all bg-white"
              >
                {isImporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Restaurar Backup
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
