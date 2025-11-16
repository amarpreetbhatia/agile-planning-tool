import { Metadata } from 'next'
import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: '404 - Page Not Found | Agile Estimation Poker',
  description: 'The page you are looking for does not exist',
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-2xl">Page Not Found</CardTitle>
          </div>
          <CardDescription>
            The page you are looking for doesn&apos;t exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please check the URL or return to the homepage to find what you&apos;re looking for.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button asChild className="flex-1">
            <Link href="/">Go Home</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/sessions/new">Create Session</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
