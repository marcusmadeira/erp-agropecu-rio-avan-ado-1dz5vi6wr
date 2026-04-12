import { Link, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from '@/components/ui/sidebar'
import { useRealtime } from '@/hooks/use-realtime'
import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { navigationMenu } from './navigation-data'

export function AppSidebar() {
  const location = useLocation()
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  const fetchUnreadCount = async () => {
    if (!user) return
    try {
      const records = await pb.collection('notificacoes').getList(1, 1, {
        filter: `usuario_id = "${user.id}" && lido = false`,
      })
      setUnreadCount(records.totalItems)
    } catch (e) {
      console.error('Error fetching unread notifications', e)
    }
  }

  const fetchConfig = async () => {
    try {
      const records = await pb.collection('configuracoes_sistema').getList(1, 1)
      if (records.items.length > 0 && records.items[0].logo) {
        setLogoUrl(pb.files.getURL(records.items[0], records.items[0].logo))
      }
    } catch (e) {
      console.error('Error fetching config', e)
    }
  }

  useEffect(() => {
    fetchUnreadCount()
    fetchConfig()
  }, [user])

  useRealtime('notificacoes', fetchUnreadCount)
  useRealtime('configuracoes_sistema', fetchConfig)

  const getRoleLevel = (role: string | number | undefined) => {
    if (typeof role === 'number') return role
    switch (role) {
      case 'Gerente':
        return 1
      case 'Financeiro':
        return 2
      case 'Operacional':
        return 3
      default:
        return 1
    }
  }

  const userRole = getRoleLevel(user?.nivel_acesso)

  return (
    <Sidebar>
      <SidebarHeader className="h-16 flex items-center justify-center border-b bg-white">
        <div className="flex items-center justify-center w-full px-4">
          {logoUrl ? (
            <img src={logoUrl} alt="Toriba Agropecuária" className="h-10 w-auto object-contain" />
          ) : (
            <span className="text-primary text-center uppercase tracking-tighter font-extrabold text-sm w-full truncate">
              TORIBA AGROPECUÁRIA
            </span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-slate-950 text-slate-300">
        {navigationMenu.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.roles || item.roles.includes(userRole),
          )
          if (visibleItems.length === 0) return null

          return (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const isActive =
                      location.pathname === item.url || location.pathname.startsWith(`${item.url}/`)
                    const isExactlyActive = item.url === '/' ? location.pathname === '/' : isActive

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isExactlyActive}
                          className={
                            isExactlyActive
                              ? 'bg-primary/20 text-white hover:bg-primary/30 hover:text-white'
                              : 'hover:bg-slate-800 hover:text-white'
                          }
                        >
                          <Link to={item.url} className="flex items-center">
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                        {item.badge && unreadCount > 0 && (
                          <SidebarMenuBadge className="bg-primary text-white rounded-full px-2 py-0.5 text-xs right-2">
                            {unreadCount}
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
      <SidebarFooter className="border-t border-slate-800 p-4 bg-slate-950 text-slate-300">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium leading-none truncate text-white">
              {user?.name || 'Usuário'}
            </span>
            <span className="text-xs text-slate-400 mt-1 truncate">{user?.email}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
