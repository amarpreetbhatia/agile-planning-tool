"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Github, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)

  const handleGitHubSignIn = async () => {
    try {
      setIsLoading(true)
      await signIn("github", { callbackUrl: "/" })
    } catch (error) {
      console.error("Sign in error:", error)
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
        <CardDescription>
          Sign in with your GitHub account to start estimating with your team
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleGitHubSignIn}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <Github className="mr-2 h-5 w-5" />
              Sign in with GitHub
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </CardContent>
    </Card>
  )
}
