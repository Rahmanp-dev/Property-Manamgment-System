"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createBuilding } from "@/lib/actions/building"
import { createBuildingSchema, CreateBuildingInput } from "@/lib/validations"

export function AddBuildingDialog() {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const form = useForm({
        resolver: zodResolver(createBuildingSchema),
        defaultValues: {
            name: "",
            address: "",
            totalFloors: 1,
        },
    })

    async function onSubmit(values: CreateBuildingInput) {
        const result = await createBuilding(values)

        if (result.success) {
            setOpen(false)
            form.reset()
            router.refresh()
        } else {
            console.error(result.error)
            // Ideally show toast here
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> Add Building
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Building</DialogTitle>
                    <DialogDescription>
                        Enter building details. Floors will be auto-generated.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Building Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Galaxy Apartments" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123 Main St, City" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="totalFloors"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total Floors</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} value={field.value as number} onChange={e => field.onChange(+e.target.value)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">Create Building</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
