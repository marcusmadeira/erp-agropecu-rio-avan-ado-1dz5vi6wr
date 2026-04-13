import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

export default function ImportarAnimaisTab() {
  return (
    <Card className="border-t-4 border-t-[#094016] shadow-md">
      <CardHeader>
        <CardTitle>Importar Animais</CardTitle>
        <CardDescription>Faça o upload da planilha de animais do seu rebanho.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-slate-50 mt-4 cursor-pointer hover:bg-slate-100 transition-colors">
        <Upload className="h-12 w-12 text-slate-400 mb-4" />
        <h3 className="text-lg font-medium text-slate-900">Selecione o arquivo de Animais</h3>
        <p className="text-sm text-slate-500 mb-6 mt-1">Formatos suportados: .csv, .pdf</p>
        <Button variant="outline">Escolher Arquivo</Button>
      </CardContent>
    </Card>
  )
}
