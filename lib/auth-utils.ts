import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

/**
 * Get the current session or redirect to login if not authenticated
 * Use this in Server Components and Server Actions
 */
export async function getSessionOrRedirect() {
  const session = await auth()
  
  if (!session || !session.user) {
    redirect("/login")
  }
  
  return session
}

/**
 * Get the current session (returns null if not authenticated)
 * Use this when you want to handle unauthenticated state manually
 */
export async function getSession() {
  return await auth()
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await auth()
  return !!session?.user
}
