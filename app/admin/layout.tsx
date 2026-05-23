import AdminSidebar from '@/components/admin/AdminSidebar'
import { headers } from 'next/headers'

export const metadata = { title: 'Admin — Drama' }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = headers()
  const pathname = headersList.get('x-pathname') ?? ''
  const isLogin = pathname === '/admin/login'

  if (isLogin) {
    return (
      <div className="admin-shell min-h-screen bg-zinc-950 text-white">
        {children}
      </div>
    )
  }

  return (
    <div className="admin-shell flex min-h-screen flex-col overflow-x-hidden bg-zinc-950 text-white md:flex-row">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto pb-32 md:pb-0">{children}</main>
    </div>
  )
}
