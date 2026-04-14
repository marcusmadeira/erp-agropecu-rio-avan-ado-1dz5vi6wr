import { ManualEntryForm } from './components/ManualEntryForm'
import { ManualEntryHistory } from './components/ManualEntryHistory'

export default function CadastroManual() {
  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-[#094016] tracking-tight">
          Cadastro Manual de Estoque
        </h1>
        <p className="text-muted-foreground mt-1">
          Registre entradas de insumos que não possuem notas fiscais sistêmicas.
        </p>
      </div>
      <div className="grid gap-6">
        <ManualEntryForm />
        <ManualEntryHistory />
      </div>
    </div>
  )
}
