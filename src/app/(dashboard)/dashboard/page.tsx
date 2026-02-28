import { getBuildings } from "@/lib/actions/building"
import { getDashboardStats } from "@/lib/actions/dashboard"
import { BuildingCard } from "@/components/dashboard/building-card"
import { AddBuildingDialog } from "@/components/dashboard/add-building-dialog"
import { AlertTriangle, TrendingUp, Wallet, Clock, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PendingPaymentsTable } from "@/components/dashboard/pending-payments-table"

export default async function DashboardPage() {
    const [{ data: buildings }, { data: stats }] = await Promise.all([
        getBuildings(),
        getDashboardStats()
    ])

    if (!buildings || !stats) {
        return <div className="p-8 text-muted-foreground">Error loading dashboard</div>
    }

    const { revenue, alerts, counts } = stats

    return (
        <div className="space-y-8">
            {/* Top Stats Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue (Exp)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{revenue.expected.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Current Month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Collected</CardTitle>
                        <Wallet className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{revenue.collected.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Outstanding: <span className="text-red-500 font-bold">₹{revenue.outstanding.toLocaleString()}</span>
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
                        <Users className="h-4 w-4 text-violet-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{counts.tenants}</div>
                    </CardContent>
                </Card>

                {/* Smart Alerts Section */}
                <Card className="col-span-1 border-l-4 border-l-amber-500 bg-amber-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-900">
                            <AlertTriangle className="h-4 w-4" /> Smart Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {alerts.overdue.length > 0 ? (
                                <div className="text-sm text-red-600 font-medium">
                                    {alerts.overdue.length} Payments Overdue
                                </div>
                            ) : (
                                <div className="text-sm text-green-600 flex items-center gap-1">
                                    No overdue payments
                                </div>
                            )}

                            {alerts.expiring.length > 0 && (
                                <div className="text-sm text-amber-700 font-medium flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {alerts.expiring.length} Leases Expiring Soon
                                </div>
                            )}

                            {alerts.overdue.length === 0 && alerts.expiring.length === 0 && (
                                <div className="text-sm text-muted-foreground">All systems normal.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Payments Section */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">Pending Dues</h2>
                <PendingPaymentsTable payments={alerts.overdue} />
            </div>

            {/* Buildings Grid */}
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Property Overview</h2>
                <AddBuildingDialog />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {buildings.map((building) => (
                    // Calculate specific building stats on the fly or improve getBuildings to return computed fields
                    // For now, passing raw data and letting card handle basic display
                    <BuildingCard
                        key={building.id}
                        building={{
                            id: building.id,
                            name: building.name,
                            address: building.address,
                            totalFlats: building.totalFlats,
                            occupiedFlats: building.flats.filter(f => f.status === 'OCCUPIED').length,
                            totalRevenue: building.flats.reduce((sum, f) => sum + f.rentAmount, 0),
                            // Collected logic would need payment joining, handled in getDashboardStats for global, 
                            // but here we might just show potential revenue for simplicity or fetch deeper.
                            // Let's assume we want accurate gathered revenue per building.
                            // We'll update the BuildingCard to handle simplified props if needed or accept that it might be 0 until implemented
                            collectedRevenue: 0
                        }}
                    />
                ))}
                {buildings.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground border-dashed border-2 rounded-xl">
                        No properties found. Add your first building to get started.
                    </div>
                )}
            </div>
        </div>
    )
}
