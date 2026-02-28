import { getDashboardStats } from './src/lib/actions/dashboard'
import { getBuildings } from './src/lib/actions/building'
import dotenv from 'dotenv'

dotenv.config()

async function testActions() {
    console.log("Testing getBuildings()...")
    const bRes = await getBuildings()
    console.log("Buildings Response:", JSON.stringify(bRes, null, 2))

    console.log("\nTesting getDashboardStats()...")
    const sRes = await getDashboardStats()
    console.log("Stats Response:", JSON.stringify(sRes, null, 2))
}

testActions().catch(console.error)
