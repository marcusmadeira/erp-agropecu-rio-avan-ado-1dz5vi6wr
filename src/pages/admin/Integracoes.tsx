import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Cloud,
  DollarSign,
  Wheat,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  getCommodities,
  getWeather,
  getCurrency,
  CommoditiesData,
  WeatherData,
  CurrencyData,
} from '@/services/integracoes'

export default function Integracoes() {
  const [commodities, setCommodities] = useState<CommoditiesData | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [currency, setCurrency] = useState<CurrencyData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [cData, wData, curData] = await Promise.all([
        getCommodities(),
        getWeather(),
        getCurrency(),
      ])
      setCommodities(cData)
      setWeather(wData)
      setCurrency(curData)
    } catch (err: any) {
      console.error(err)
      setError('Falha ao conectar com os serviços de integração. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const renderVariation = (variacao: number) => {
    if (variacao > 0) {
      return (
        <span className="flex items-center text-emerald-600 text-sm">
          <TrendingUp className="h-4 w-4 mr-1" /> +{variacao}%
        </span>
      )
    }
    if (variacao < 0) {
      return (
        <span className="flex items-center text-rose-600 text-sm">
          <TrendingDown className="h-4 w-4 mr-1" /> {variacao}%
        </span>
      )
    }
    return <span className="text-slate-500 text-sm">0%</span>
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Integrações</h1>
          <p className="text-slate-500 mt-1">Monitore dados externos conectados à plataforma.</p>
        </div>
        <Button onClick={loadData} disabled={loading} className="bg-slate-900 hover:bg-slate-800">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Sincronizar Agora
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro de Conexão</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-slate-900 flex items-center">
                <Wheat className="h-5 w-5 mr-2 text-amber-500" /> Commodities
              </CardTitle>
              <div
                className={`h-2 w-2 rounded-full ${commodities ? 'bg-emerald-500' : 'bg-slate-300'}`}
              ></div>
            </div>
            <CardDescription>
              {commodities
                ? `Atualizado em: ${format(new Date(commodities.last_updated), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`
                : 'Aguardando dados...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {commodities ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Boi Gordo (@)</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 font-mono">
                      {formatCurrency(commodities.boi_gordo.preco)}
                    </span>
                    {renderVariation(commodities.boi_gordo.variacao)}
                  </div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Milho (sc)</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 font-mono">
                      {formatCurrency(commodities.milho.preco)}
                    </span>
                    {renderVariation(commodities.milho.variacao)}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Soja (sc)</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 font-mono">
                      {formatCurrency(commodities.soja.preco)}
                    </span>
                    {renderVariation(commodities.soja.variacao)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-sm">Carregando cotações...</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-slate-900 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-emerald-600" /> Câmbio
              </CardTitle>
              <div
                className={`h-2 w-2 rounded-full ${currency ? 'bg-emerald-500' : 'bg-slate-300'}`}
              ></div>
            </div>
            <CardDescription>
              {currency
                ? `Atualizado em: ${format(new Date(currency.last_updated), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`
                : 'Aguardando dados...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currency ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Dólar (USD)</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 font-mono">
                      {formatCurrency(currency.USD.cotacao)}
                    </span>
                    {renderVariation(currency.USD.variacao)}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Euro (EUR)</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 font-mono">
                      {formatCurrency(currency.EUR.cotacao)}
                    </span>
                    {renderVariation(currency.EUR.variacao)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-sm">Carregando câmbio...</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-slate-900 flex items-center">
                <Cloud className="h-5 w-5 mr-2 text-sky-500" /> Previsão do Tempo
              </CardTitle>
              <div
                className={`h-2 w-2 rounded-full ${weather ? 'bg-emerald-500' : 'bg-slate-300'}`}
              ></div>
            </div>
            <CardDescription>
              {weather
                ? `Atualizado em: ${format(new Date(weather.last_updated), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`
                : 'Aguardando dados...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weather ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-slate-900">{weather.temperatura}°C</div>
                  <div className="flex flex-col">
                    <span className="text-slate-700 font-medium">{weather.condicao}</span>
                    <span className="text-slate-500 text-sm">{weather.cidade}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <span className="block text-xs text-slate-500">Probabilidade de Chuva</span>
                    <span className="font-medium text-slate-900">
                      {weather.probabilidade_chuva}%
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Umidade Relativa</span>
                    <span className="font-medium text-slate-900">{weather.umidade}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-sm">Carregando previsão...</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
