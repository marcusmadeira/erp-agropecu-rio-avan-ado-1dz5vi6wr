import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export default function Layout() {
  const { signOut } = useAuth()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-white dark:bg-slate-950 z-10">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="font-semibold text-[#1A237E] dark:text-slate-100 hidden sm:block">
              ERP Agropecuário Avançado
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-slate-500 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-900">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
