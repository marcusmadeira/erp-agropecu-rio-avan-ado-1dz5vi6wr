import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { Button } from '@/components/ui/button'
import { LogOut, WifiOff } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useNetwork } from '@/hooks/use-network'

export default function Layout() {
  const { signOut } = useAuth()
  const isOnline = useNetwork()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6 bg-white dark:bg-slate-950 z-10 shadow-sm">
          <div className="flex items-center gap-2 md:gap-4">
            <SidebarTrigger />
            <h1 className="font-semibold text-[#000080] dark:text-slate-100 hidden sm:block">
              Gestão Pecuária 360º
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {!isOnline && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive text-sm font-medium rounded-full border border-destructive/20 animate-pulse">
                <WifiOff className="w-4 h-4" />
                <span className="hidden sm:inline">Modo Offline</span>
                <span className="sm:hidden">Offline</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-slate-500 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Sair</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-900">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
