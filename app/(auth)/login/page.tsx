import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Login | Agile Estimation Poker",
  description: "Sign in with your GitHub account to start estimating",
}

export default async function LoginPage() {
  const session = await auth()

  // Redirect to dashboard if already authenticated
  if (session?.user) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <LoginForm />
    </div>
  )
}
