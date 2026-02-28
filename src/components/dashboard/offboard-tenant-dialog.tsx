"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

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
import { offboardTenant } from "@/lib/actions/tenant"

interface OffboardTenantDialogProps {
    flatId: string
    tenantName: string
}

export function OffboardTenantDialog({ flatId, tenantName }: OffboardTenantDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleOffboard = async () => {
        setLoading(true)
        const result = await offboardTenant(flatId)

        if (result.success) {
            setOpen(false)
            router.refresh()
        } else {
            console.error(result.error)
            alert(result.error)
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    <LogOut className="mr-2 h-4 w-4" /> End Lease
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Confirm Move Out</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to end the lease for <strong>{tenantName}</strong>?
                        This will mark the flat as VACANT and deactivate the tenant.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleOffboard} disabled={loading}>
                        {loading ? "Processing..." : "Confirm Move Out"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
