'use server'

import clientPromise from "@/lib/mongo"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ObjectId } from "mongodb"

const recordReadingSchema = z.object({
    flatId: z.string(),
    reading: z.coerce.number().min(0),
    month: z.coerce.number().min(0).max(11),
    year: z.coerce.number().min(2024)
})

export type RecordReadingInput = z.infer<typeof recordReadingSchema>

export async function recordMeterReading(data: RecordReadingInput) {
    const result = recordReadingSchema.safeParse(data)

    if (!result.success) {
        return { error: "Invalid input" }
    }

    const { flatId, reading, month, year } = result.data

    try {
        const client = await clientPromise
        const db = client.db("lpm_rental")

        // Use Native MongoDB for upsert (avoiding Prisma complexity on standalone)
        await db.collection("MeterReading").updateOne(
            {
                flatId: new ObjectId(flatId),
                month: month,
                year: year
            },
            {
                $set: {
                    reading: reading,
                    readingDate: new Date(),
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            { upsert: true }
        )

        revalidatePath(`/flats/${flatId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to record meter reading:", error)
        return { error: "Failed to record meter reading" }
    }
}

export async function getFlatReadings(flatId: string) {
    try {
        const readings = await prisma.meterReading.findMany({
            where: { flatId },
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
            take: 12
        })
        return { success: true, data: readings }
    } catch (error) {
        console.error("Failed to fetch readings:", error)
        return { error: "Failed to fetch readings" }
    }
}
