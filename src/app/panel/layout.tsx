'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Package,
  Store,
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User,
  Loader2,
  Users,
  ShoppingCart,
  CheckSquare,
} from 'lucide-react'
import { useStore } from '@/lib/store'

const sidebarItems = [
  { name: 'Dashboard', href: '/panel', icon: LayoutDashboard, roles: ['admin', 'yonetici', 'magaza'] },
  { name: 'Talep Geçme', href: '/panel/talep-gecme', icon: ShoppingCart, roles: ['magaza'] },
  { name: 'Talep Onay', href: '/panel/talep-onay', icon: CheckSquare, roles: ['admin', 'yonetici'] },
  { name: 'Malzemeler', href: '/panel/malzemeler', icon: Package, roles: ['admin', 'yonetici'] },
  { name: 'Mağazalar', href: '/panel/magazalar', icon: Store, roles: ['admin', 'yonetici'] },
  { name: 'Stok & Satış', href: '/panel/stok-satis', icon: ClipboardList, roles: ['admin', 'yonetici'] },
  { name: 'İhtiyaç Planlama', href: '/panel/ihtiyac', icon: BarChart3, roles: ['admin', 'yonetici'] },
  { name: 'Ayarlar', href: '/panel/ayarlar', icon: Settings, roles: ['admin', 'yonetici'] },
  { name: 'Kullanıcı Yönetimi', href: '/panel/kullanicilar', icon: Users, roles: ['admin'] },
]

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { session, loading, logout } = useStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auth check
  useEffect(() => {
    if (!loading && !session) {
      router.push('/giris')
    }
  }, [session, loading, router])

  const handleLogout = () => {
    logout()
    router.push('/giris')
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))] mx-auto" />
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] z-50 flex items-center justify-between px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-[hsl(var(--accent))] rounded-lg"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-[hsl(var(--primary))]" />
          <span className="font-semibold text-sm">Sarf Malzeme</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] z-50 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))]/10 flex items-center justify-center flex-shrink-0">
              <Package className="h-4 w-4 text-[hsl(var(--primary))]" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-[hsl(var(--foreground))] truncate">Sarf Malzeme</div>
              <div className="text-[10px] text-[hsl(var(--muted-foreground))]">Stok Yönetimi</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-[hsl(var(--accent))] rounded flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {sidebarItems
            .filter(item => item.roles.includes(session.rol))
            .map((item) => {
              const isActive = pathname === item.href || (item.href !== '/panel' && pathname.startsWith(item.href))
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
                      : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                  {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                </Link>
              )
            })}
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-[hsl(var(--border))]">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center">
                <User className="h-4 w-4 text-[hsl(var(--primary))]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{session.ad}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] truncate">{session.email}</div>
              </div>
            </div>
          </div>
          {/* Logout */}
          <div className="p-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-500 transition-colors w-full"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Çıkış Yap</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
