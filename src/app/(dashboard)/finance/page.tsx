import { getFinanceStats } from "@/lib/actions/finance"
import { GenerateDuesButton } from "@/components/dashboard/generate-dues-button"
import { FinanceCharts } from "@/components/dashboard/finance-charts"

export default async function FinancePage() {
    const { data, error } = await getFinanceStats()

    if (error || !data) {
        return <div className="p-8 text-center text-muted-foreground">Error loading finance data</div>
    }

    const { totalRevenue, outstanding, chartData, recentTransactions } = data

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Financial Command Center</h1>
                <GenerateDuesButton />
            </div>

            <FinanceCharts
                totalRevenue={totalRevenue}
                outstanding={outstanding}
                chartData={chartData}
                recentTransactions={recentTransactions}
            />
        </div>
    )
}
