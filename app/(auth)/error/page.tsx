import { Metadata } from "next"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Authentication Error | Agile Estimation Poker",
  description: "An error occurred during authentication",
}

interface ErrorPageProps {
  searchParams: Promise<{
    error?: string
  }>
}

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Configuration Error",
    description: "There is a problem with the server configuration. Please contact support.",
  },
  AccessDenied: {
    title: "Access Denied",
    description: "You do not have permission to sign in. Please contact your administrator.",
  },
  Verification: {
    title: "Verification Failed",
    description: "The verification token has expired or has already been used.",
  },
  OAuthSignin: {
    title: "OAuth Sign In Error",
    description: "Error occurred while trying to sign in with GitHub.",
  },
  OAuthCallback: {
    title: "OAuth Callback Error",
    description: "Error occurred during the OAuth callback process.",
  },
  OAuthCreateAccount: {
    title: "Account Creation Error",
    description: "Could not create an account with GitHub. Please try again.",
  },
  EmailCreateAccount: {
    title: "Email Account Error",
    description: "Could not create an email account.",
  },
  Callback: {
    title: "Callback Error",
    description: "Error occurred during the authentication callback.",
  },
  OAuthAccountNotLinked: {
    title: "Account Not Linked",
    description: "This account is already associated with another sign-in method.",
  },
  SessionRequired: {
    title: "Session Required",
    description: "You must be signed in to access this page.",
  },
  Default: {
    title: "Authentication Error",
    description: "An unexpected error occurred during authentication. Please try again.",
  },
}

export default async function ErrorPage({ searchParams }: ErrorPageProps) {
  const params = await searchParams
  const errorType = params.error || "Default"
  const errorInfo = errorMessages[errorType] || errorMessages.Default

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-2xl">{errorInfo.title}</CardTitle>
          </div>
          <CardDescription>{errorInfo.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            If this problem persists, please contact support or try again later.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button asChild className="flex-1">
            <Link href="/login">Try Again</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/">Go Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
