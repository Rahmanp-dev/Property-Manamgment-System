"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Play } from "lucide-react"
import { generateMonthlyDues } from "@/lib/actions/rental-engine"
import { useRouter } from "next/navigation"

export function GenerateDuesButton() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleGenerate() {
        setLoading(true)
        const result = await generateMonthlyDues()
        setLoading(false)

        if (result.success) {
            alert(`Successfully generated dues for ${result.count} tenants.`)
            router.refresh()
        } else {
            alert("Failed to generate dues.")
        }
    }

    return (
        <Button onClick={handleGenerate} disabled={loading} variant="outline">
            {loading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Play className="mr-2 h-4 w-4" />
            )}
            Generate Monthly Dues
        </Button>
    )
}
