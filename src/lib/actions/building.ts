'use server'

import prisma from "@/lib/prisma"
import clientPromise from "@/lib/mongo"
import { createBuildingSchema, CreateBuildingInput } from "@/lib/validations"
import { revalidatePath } from "next/cache"

export async function createBuilding(data: CreateBuildingInput) {
    const result = createBuildingSchema.safeParse(data)

    if (!result.success) {
        return { error: "Invalid input" }
    }

    const { name, address, totalFloors, defaultRentBHK1, defaultRentBHK2, defaultRentBHK3, ratePerUnit } = result.data

    try {
        const client = await clientPromise
        const db = client.db("lpm_rental")

        const now = new Date()
        const buildingDoc = {
            name,
            address,
            totalFloors,
            totalFlats: 0,
            occupancyRate: 0.0,
            ratePerUnit: ratePerUnit ?? 10,
            defaultRentBHK1: defaultRentBHK1 ?? 8000,
            defaultRentBHK2: defaultRentBHK2 ?? 12000,
            defaultRentBHK3: defaultRentBHK3 ?? 16000,
            createdAt: now,
            updatedAt: now
        }

        const insertResult = await db.collection("Building").insertOne(buildingDoc)
        const buildingId = insertResult.insertedId.toString()

        // Auto-generate floors
        const floorsData = Array.from({ length: totalFloors }).map((_, i) => ({
            buildingId: insertResult.insertedId,
            number: i,
            flatsCount: 0,
        }))

        if (floorsData.length > 0) {
            await db.collection("Floor").insertMany(floorsData)
        }

        revalidatePath('/dashboard')
        revalidatePath('/buildings')
        revalidatePath('/')
        return { success: true, data: { ...buildingDoc, id: buildingId } }
    } catch (error: any) {
        console.error("Failed to create building:", error)
        return { error: `Failed to create building: ${error.message || String(error)}` }
    }
}

export async function getBuildings() {
    try {
        const buildings = await prisma.building.findMany({
            include: {
                floors: true,
                flats: {
                    include: {
                        payments: {
                            where: {
                                month: {
                                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        return { success: true, data: buildings }
    } catch (error: any) {
        console.error("Failed to fetch buildings:", error)
        return { error: `Failed to fetch buildings: ${error.message || String(error)}` }
    }
}
