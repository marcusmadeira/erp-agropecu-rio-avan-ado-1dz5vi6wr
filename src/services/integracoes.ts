import pb from '@/lib/pocketbase/client'

export interface CommoditiesData {
  boi_gordo: { preco: number; variacao: number }
  milho: { preco: number; variacao: number }
  soja: { preco: number; variacao: number }
  last_updated: string
}

export interface WeatherData {
  temperatura: number
  condicao: string
  probabilidade_chuva: number
  umidade: number
  cidade: string
  last_updated: string
}

export interface CurrencyData {
  USD: { cotacao: number; variacao: number }
  EUR: { cotacao: number; variacao: number }
  last_updated: string
}

export const getCommodities = (): Promise<CommoditiesData> =>
  pb.send('/backend/v1/integrations/commodities', { method: 'GET' })

export const getWeather = (): Promise<WeatherData> =>
  pb.send('/backend/v1/integrations/weather', { method: 'GET' })

export const getCurrency = (): Promise<CurrencyData> =>
  pb.send('/backend/v1/integrations/currency', { method: 'GET' })
