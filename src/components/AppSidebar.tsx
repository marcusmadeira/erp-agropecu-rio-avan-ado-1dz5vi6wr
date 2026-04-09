import { Link, useLocation } from 'react-router-dom'
import { Activity } from 'lucide-react'
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

  useEffect(() => {
    fetchUnreadCount()
  }, [user])
  useRealtime('notificacoes', fetchUnreadCount)

  return (
    <Sidebar>
      <SidebarHeader className="h-16 flex items-center justify-center border-b bg-slate-950">
        <div className="flex items-center gap-2 font-bold text-lg text-white">
          <Activity className="h-6 w-6 text-blue-400" />
          <span>Curling ERP</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-slate-950 text-slate-300">
        {navigationMenu.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.url
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={
                          isActive
                            ? 'bg-slate-800 text-white'
                            : 'hover:bg-slate-800 hover:text-white'
                        }
                      >
                        <Link to={item.url} className="flex items-center">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      {item.badge && unreadCount > 0 && (
                        <SidebarMenuBadge className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs right-2">
                          {unreadCount}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-slate-800 p-4 bg-slate-950 text-slate-300">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
            {user?.name?.charAt(0) || 'U'}
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
