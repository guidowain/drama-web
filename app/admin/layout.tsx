import AdminSidebar from '@/components/admin/AdminSidebar'
import { headers } from 'next/headers'

export const metadata = { title: 'Admin — Drama' }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = headers()
  const pathname = headersList.get('x-pathname') ?? ''
  const isLogin = pathname === '/admin/login'

  if (isLogin) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        {children}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
