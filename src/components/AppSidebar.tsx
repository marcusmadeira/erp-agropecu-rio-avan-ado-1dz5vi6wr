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
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

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
    fetchConfig()
  }, [user])

  useRealtime('configuracoes_sistema', fetchConfig)

  const getRoleLevel = (u: any) => {
    if (!u) return 3
    if (u.role === 'Admin' || u.nivel_acesso === 'Gerente') return 1
    if (u.nivel_acesso === 'Financeiro') return 2
    return 3
  }

  const userRole = getRoleLevel(user)

  return (
    <Sidebar>
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-[#10213d] bg-[#10213d]">
        <div className="flex items-center justify-center w-full px-4">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Toriba Agropecuária"
              className="h-10 w-auto object-contain brightness-0 invert"
            />
          ) : (
            <span className="text-white font-serif text-2xl text-center tracking-wide w-full truncate">
              Toriba Premium
            </span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-[#10213d] text-slate-300 font-sans">
        {navigationMenu.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (!item.roles) return true
            return item.roles.includes(userRole)
          })
          if (visibleItems.length === 0) return null

          return (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const [itemPath, itemHash] = item.url.split('#')
                    const isActive =
                      location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`)

                    let isExactlyActive = item.url === '/' ? location.pathname === '/' : isActive

                    if (itemHash) {
                      isExactlyActive = isActive && location.hash === `#${itemHash}`
                    } else if (itemPath === '/reproducao' && location.hash) {
                      isExactlyActive = false
                    }

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
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
      <SidebarFooter className="border-t border-[#1a2f4d] p-4 bg-[#10213d] text-slate-300">
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
