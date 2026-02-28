
'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { authenticate } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2 } from 'lucide-react'

export default function LoginPage() {
    const [errorMessage, dispatch] = useActionState(authenticate, undefined)

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50">
            <form action={dispatch} className="w-full max-w-md">
                <Card>
                    <CardHeader className="space-y-1">
                        <div className="flex justify-center mb-4">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <Building2 className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl text-center">Property Management System</CardTitle>
                        <CardDescription className="text-center">
                            Property Management System Login
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="admin@lpm.com" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col">
                        <LoginButton />
                        <div
                            className="flex h-8 items-end space-x-1"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            {errorMessage && (
                                <p className="text-sm text-red-500">{errorMessage}</p>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            </form>
        </div>
    )
}

function LoginButton() {
    const { pending } = useFormStatus()

    return (
        <Button className="w-full" aria-disabled={pending}>
            {pending ? "Logging in..." : "Login"}
        </Button>
    )
}
