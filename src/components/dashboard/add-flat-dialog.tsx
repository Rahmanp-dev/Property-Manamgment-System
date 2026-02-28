"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { createFlat } from "@/lib/actions/flat"

interface AddFlatDialogProps {
    buildingId: string
    floors: { id: string; number: number }[]
}

export function AddFlatDialog({ buildingId, floors }: AddFlatDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const [floorId, setFloorId] = useState("")
    const [flatNumber, setFlatNumber] = useState("")
    const [rentAmount, setRentAmount] = useState("")
    const [maintenanceAmount, setMaintenanceAmount] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!floorId) {
            setError("Please select a floor")
            return
        }

        setLoading(true)
        setError("")

        const result = await createFlat({
            buildingId,
            floorId,
            flatNumber,
            rentAmount: parseFloat(rentAmount),
            maintenanceAmount: parseFloat(maintenanceAmount)
        })

        setLoading(false)

        if (result.error) {
            setError(result.error)
        } else {
            setOpen(false)
            // Reset form
            setFloorId("")
            setFlatNumber("")
            setRentAmount("")
            setMaintenanceAmount("")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Flat
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add New Flat</DialogTitle>
                        <DialogDescription>
                            Add a new flat to this building. Select the floor and enter the details.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Floor Selection - Simple Radio Buttons for reliability */}
                        <div className="space-y-2">
                            <Label>Floor</Label>
                            {floors.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {floors.map((floor) => (
                                        <Button
                                            key={floor.id}
                                            type="button"
                                            variant={floorId === floor.id ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setFloorId(floor.id)}
                                        >
                                            Floor {floor.number}
                                        </Button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No floors found. Please add floors when creating the building.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="flatNumber" className="text-right">
                                Flat #
                            </Label>
                            <Input
                                id="flatNumber"
                                value={flatNumber}
                                onChange={(e) => setFlatNumber(e.target.value)}
                                placeholder="e.g., 101"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="rent" className="text-right">
                                Rent (₹)
                            </Label>
                            <Input
                                id="rent"
                                type="number"
                                value={rentAmount}
                                onChange={(e) => setRentAmount(e.target.value)}
                                placeholder="12000"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="maintenance" className="text-right">
                                Maint. (₹)
                            </Label>
                            <Input
                                id="maintenance"
                                type="number"
                                value={maintenanceAmount}
                                onChange={(e) => setMaintenanceAmount(e.target.value)}
                                placeholder="1500"
                                className="col-span-3"
                                required
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-red-500 text-center">{error}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading || floors.length === 0}>
                            {loading ? "Adding..." : "Add Flat"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
