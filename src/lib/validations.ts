import { z } from "zod"

export const createBuildingSchema = z.object({
    name: z.string().min(1, "Name is required"),
    address: z.string().min(1, "Address is required"),
    totalFloors: z.coerce.number().min(1, "Must have at least 1 floor"),
})

export type CreateBuildingInput = z.infer<typeof createBuildingSchema>

export const onboardTenantSchema = z.object({
    fullName: z.string().min(1, "Name is required"),
    phone: z.string().min(10, "Invalid phone number"),
    aadhaarNumber: z.string().optional(),
    occupantsCount: z.coerce.number().min(1),
    leaseStartDate: z.date(),
    leaseEndDate: z.date().optional(),
    flatId: z.string().min(1, "Flat ID is required"),
    rentAmount: z.coerce.number().min(0),     // Allow overriding flat's default rent
    depositAmount: z.coerce.number().min(0),
    initialMeterReading: z.coerce.number().min(0).optional(),
})

export type OnboardTenantInput = z.infer<typeof onboardTenantSchema>
