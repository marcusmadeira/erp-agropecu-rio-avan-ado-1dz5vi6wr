import useAppStore from '@/stores/useAppStore'
import ProductionInventory from '@/components/dashboard/ProductionInventory'
import MaternityLight from '@/components/dashboard/MaternityLight'
import StockPredictor from '@/components/dashboard/StockPredictor'

export default function Desempenho() {
  const { state } = useAppStore()

  if (state.userRole === 3) {
    return <div className="p-4 text-center">Área gerencial restrita.</div>
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-primary tracking-tight">Rebanho + Estoque</h2>
        <p className="text-sm text-muted-foreground">
          Dashboard de Produção: Inventário, Reprodução e Previsão de Insumos
        </p>
      </div>

      <ProductionInventory />

      <div className="grid gap-6 md:grid-cols-2">
        <MaternityLight />
        <StockPredictor />
      </div>
    </div>
  )
}
