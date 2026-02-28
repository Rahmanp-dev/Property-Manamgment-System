import { Sidebar } from "@/components/layout/sidebar"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"
import { auth } from "@/lib/auth"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                <Sidebar user={session?.user} />
            </div>
            <main className="md:pl-72 h-full bg-slate-50 dark:bg-black">
                {/* Mobile Header */}
                <div className="flex items-center p-4 border-b h-16 bg-white dark:bg-gray-900 md:hidden">
                    <MobileSidebar user={session?.user} />
                    <span className="font-bold ml-4">PropManager</span>
                </div>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
