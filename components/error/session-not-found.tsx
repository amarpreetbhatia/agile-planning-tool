import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export function SessionNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-2xl">Session Not Found</CardTitle>
          </div>
          <CardDescription>
            The session you&apos;re looking for doesn&apos;t exist or has been deleted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The session may have ended, or the link might be incorrect. Please check the link or create a new session.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button asChild className="flex-1">
            <Link href="/">View Sessions</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/sessions/new">Create New</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
