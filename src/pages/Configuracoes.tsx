import React, { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ProfileTab } from './configuracoes/ProfileTab'
import { PreferencesTab } from './configuracoes/PreferencesTab'
import { User, Palette } from 'lucide-react'

export default function Configuracoes() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('perfil')

  if (!user) return null

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie seu perfil e preferências do sistema.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 bg-slate-100 p-1 rounded-lg mb-6">
          <TabsTrigger
            value="perfil"
            className="rounded-md data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <User className="w-4 h-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger
            value="preferencias"
            className="rounded-md data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <Palette className="w-4 h-4 mr-2" />
            Preferências
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="m-0 mt-6 focus-visible:outline-none">
          <ProfileTab user={user} />
        </TabsContent>

        <TabsContent value="preferencias" className="m-0 mt-6 focus-visible:outline-none">
          <PreferencesTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
