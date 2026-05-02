"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Building2,
    Users,
    IndianRupee, // Using generic Currency icon or IndianRupee if available in Lucide? Lucide has IndianRupee.
    Settings,
    LogOut
} from "lucide-react"

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        color: "text-sky-500",
    },
    {
        label: "Buildings",
        icon: Building2,
        href: "/buildings", // Maybe separate admin view? Or just use Dashboard as main entry. 
        // "Buildings" list view might be useful.
        color: "text-violet-500",
    },
    {
        label: "Tenants",
        icon: Users,
        href: "/tenants",
        color: "text-pink-700",
    },
    {
        label: "Finance",
        icon: IndianRupee,
        href: "/finance",
        color: "text-emerald-500",
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/settings",
    },
]

import { GlobalSearch } from "@/components/dashboard/global-search";
import { UserButton } from "@/components/shared/user-button";

export function Sidebar({ user }: { user?: any }) {
    const pathname = usePathname()

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white">
            <div className="px-3 py-2 flex-1">
                <Link href="/dashboard" className="flex items-center pl-3 mb-14">
                    <h1 className="text-2xl font-bold">PropX</h1>
                </Link>
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                                pathname === route.href || (route.href !== "/dashboard" && pathname.startsWith(route.href)) ? "text-white bg-white/10" : "text-zinc-400"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <div className="px-3 py-2">
                <UserButton user={user} />
            </div>
        </div>
    )
}
