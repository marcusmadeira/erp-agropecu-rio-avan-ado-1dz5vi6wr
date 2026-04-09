import { useState, useEffect } from 'react'
import { getSystemConfig, getLogoUrl } from '@/services/configuracoes'
import localLogo from '@/assets/whatsapp-image-2026-03-16-at-16.52.11-c60ad.jpeg'

export function useSystemConfig() {
  const [config, setConfig] = useState<any>(null)
  const [logoUrl, setLogoUrl] = useState<string>(localLogo)
  const [loading, setLoading] = useState(true)

  const loadConfig = async () => {
    const record = await getSystemConfig()
    if (record) {
      setConfig(record)
      const url = getLogoUrl(record)
      if (url) {
        setLogoUrl(url)
        setLoading(false)
        return
      }
    }
    setLogoUrl(localLogo)
    setLoading(false)
  }

  useEffect(() => {
    loadConfig()
  }, [])

  return { config, logoUrl, loading, reload: loadConfig }
}
