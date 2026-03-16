import AppSidebar from "@/components/AppSidebar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 ml-52 overflow-y-auto min-w-0">
        {children}
      </div>
    </div>
  )
}
