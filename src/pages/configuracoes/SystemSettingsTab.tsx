import React, { useState, useEffect } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { getSystemConfig, updateSystemConfig } from '@/services/configuracoes'
import { Calculator } from 'lucide-react'

export function SystemSettingsTab() {
  const { toast } = useToast()
  const [configId, setConfigId] = useState<string | null>(null)
  const [taxa, setTaxa] = useState<string>('1.0')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    getSystemConfig().then((record) => {
      if (record) {
        setConfigId(record.id)
        if (record.taxa_oportunidade_padrao !== undefined) {
          setTaxa(String(record.taxa_oportunidade_padrao))
        }
      }
    })
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('taxa_oportunidade_padrao', taxa)
      await updateSystemConfig(configId, formData)
      toast({
        title: 'Configurações do Sistema Salvas',
        description: 'Taxa de oportunidade atualizada com sucesso.',
      })
    } catch (err: unknown) {
      toast({ title: 'Erro', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm mt-6">
      <CardHeader>
        <CardTitle>Parâmetros Financeiros Globais</CardTitle>
        <CardDescription>
          Configurações que afetam cálculos e simulações em todo o sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-base flex items-center gap-2">
            <Calculator className="w-4 h-4 text-muted-foreground" />
            Taxa de Oportunidade Padrão (% a.m.)
          </Label>
          <p className="text-sm text-muted-foreground">
            Esta taxa será sugerida como padrão nas simulações de TIP e Confinamento.
          </p>
          <Input
            type="number"
            step="0.01"
            className="w-full md:w-[300px]"
            value={taxa}
            onChange={(e) => setTaxa(e.target.value)}
            placeholder="Ex: 1.00"
          />
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 border-t px-6 py-4">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#094016] text-white hover:bg-[#094016]/90"
        >
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </CardFooter>
    </Card>
  )
}
