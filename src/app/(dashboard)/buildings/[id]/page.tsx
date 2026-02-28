import { getBuildingDetails } from "@/lib/actions/building-details"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { AddFlatDialog } from "@/components/dashboard/add-flat-dialog"
import { UpdateBuildingDialog } from "@/components/dashboard/update-building-dialog"

export default async function BuildingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { data: building, error } = await getBuildingDetails(id)

    if (error || !building) {
        return <div className="p-8 text-center text-muted-foreground">Building not found. Please check the ID or try again.</div>
    }

    // Calculate high-level stats
    const totalFlats = building.totalFlats
    const occupied = building.floors.reduce((acc, floor) =>
        acc + floor.flats.filter(f => f.status === "OCCUPIED").length, 0
    )
    const occupancyRate = totalFlats > 0 ? Math.round((occupied / totalFlats) * 100) : 0

    // Prepare floors for the dialog
    const floorsForDialog = building.floors.map(f => ({ id: f.id, number: f.number }))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{building.name}</h1>
                    <p className="text-muted-foreground">{building.address}</p>
                </div>
                <div className="flex items-center gap-2">
                    <UpdateBuildingDialog
                        buildingId={id}
                        currentRate={(building as any).ratePerUnit || 10}
                        buildingName={building.name}
                        totalFloors={building.totalFloors}
                    />
                    <AddFlatDialog buildingId={id} floors={floorsForDialog} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg bg-card text-card-foreground shadow">
                    <div className="text-sm font-medium text-muted-foreground">Occupancy</div>
                    <div className="text-2xl font-bold">{occupancyRate}%</div>
                </div>
                <div className="p-4 border rounded-lg bg-card text-card-foreground shadow">
                    <div className="text-sm font-medium text-muted-foreground">Total Flats</div>
                    <div className="text-2xl font-bold">{totalFlats}</div>
                </div>
                <div className="p-4 border rounded-lg bg-card text-card-foreground shadow">
                    <div className="text-sm font-medium text-muted-foreground">Vacant</div>
                    <div className="text-2xl font-bold text-amber-500">{totalFlats - occupied}</div>
                </div>
                <div className="p-4 border rounded-lg bg-card text-card-foreground shadow">
                    <div className="text-sm font-medium text-muted-foreground">Issues</div>
                    <div className="text-2xl font-bold text-green-500">0</div>
                </div>
            </div>

            <Separator />

            <div className="space-y-8">
                <h2 className="text-xl font-semibold">Floors & Flats</h2>
                <div className="space-y-6">
                    {building.floors.map((floor) => (
                        <div key={floor.id} className="space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Floor {floor.number}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {floor.flats.map((flat) => (
                                    <FlatTile key={flat.id} flat={flat} />
                                ))}
                                {floor.flats.length === 0 && (
                                    <div className="col-span-full py-4 text-sm text-muted-foreground bg-slate-50 rounded-md flex items-center justify-center border border-dashed">
                                        No flats on this floor
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function FlatTile({ flat }: { flat: any }) {
    // Determine visual state
    // Status: Occupied, Vacant, Maintenance
    // Payment: Paid (Green), Pending (Red), Partial (Amber) - Logic needed based on Payment model

    // Simple logic for now:
    const isOccupied = flat.status === "OCCUPIED"
    const isMaintenance = flat.status === "UNDER_MAINTENANCE"

    let statusColor = "bg-gray-100 border-gray-200 text-gray-500" // Vacant
    let statusLabel = "Vacant"

    if (isMaintenance) {
        statusColor = "bg-orange-50 border-orange-200 text-orange-700"
        statusLabel = "Maint."
    } else if (isOccupied) {
        // Check payment status
        // Mock logic: assume paid for now unless payment data says otherwise
        const payment = flat.payments?.[0]
        if (payment && payment.status === "PAID") {
            statusColor = "bg-green-50 border-green-200 text-green-700"
            statusLabel = "Paid"
        } else if (payment && payment.status === "PARTIAL") {
            statusColor = "bg-amber-50 border-amber-200 text-amber-700"
            statusLabel = "Partial"
        } else {
            // Default occupied but status unknown or pending
            // Or if tenant exists but no payment record for this month -> Pending
            statusColor = "bg-red-50 border-red-200 text-red-700"
            statusLabel = "Due"
        }
    }

    return (
        <Link href={`/flats/${flat.id}`}>
            <div className={cn(
                "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:shadow-md cursor-pointer h-24",
                statusColor
            )}>
                <span className="text-lg font-bold">{flat.flatNumber}</span>
                <Badge variant="secondary" className="mt-1 text-[10px] h-5 px-1.5 bg-white/50 backdrop-blur-sm">
                    {statusLabel}
                </Badge>
            </div>
        </Link>
    )
}
