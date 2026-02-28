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
import { Settings } from "lucide-react"
import { updateBuildingSettings } from "@/lib/actions/building-settings"

interface UpdateBuildingDialogProps {
    buildingId: string
    currentRate: number
    buildingName: string
    totalFloors: number
}

export function UpdateBuildingDialog({ buildingId, currentRate, buildingName, totalFloors }: UpdateBuildingDialogProps & { totalFloors: number }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [rate, setRate] = useState(currentRate.toString())
    const [floors, setFloors] = useState(totalFloors.toString())

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const res = await updateBuildingSettings({
            buildingId,
            ratePerUnit: parseFloat(rate),
            totalFloors: parseInt(floors)
        })

        if (!res.success && res.error) {
            alert(res.error) // Simple alert for now
        }

        setLoading(false)
        if (res.success) setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" /> Manage
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Building Settings</DialogTitle>
                        <DialogDescription>
                            Configure settings for {buildingName}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="rate" className="text-right">
                                Elec. Rate (₹/Unit)
                            </Label>
                            <Input
                                id="rate"
                                type="number"
                                step="0.01"
                                value={rate}
                                onChange={(e) => setRate(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="floors" className="text-right">
                                Total Floors
                            </Label>
                            <Input
                                id="floors"
                                type="number"
                                min="1"
                                value={floors}
                                onChange={(e) => setFloors(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
