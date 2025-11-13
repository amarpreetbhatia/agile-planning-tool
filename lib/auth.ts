import NextAuth, { NextAuthConfig } from "next-auth"
import GitHub from "next-auth/providers/github"
import bcrypt from "bcryptjs"
import User from "@/models/User"
import connectDB from "./db"

// Encryption helper for GitHub access tokens
async function encryptToken(token: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(token, salt)
}

export const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo read:project",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/error",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Initial sign in
      if (account && user) {
        token.accessToken = account.access_token
        token.githubId = profile?.id?.toString()
        token.username = profile?.login
        token.avatarUrl = profile?.avatar_url
        
        // Store encrypted access token in database
        if (account.access_token) {
          try {
            await connectDB()
            const encryptedToken = await encryptToken(account.access_token)
            
            // Update or create user with GitHub data
            await User.findOneAndUpdate(
              { githubId: profile?.id?.toString() },
              {
                githubId: profile?.id?.toString(),
                username: profile?.login,
                email: user.email,
                avatarUrl: profile?.avatar_url,
                accessToken: encryptedToken,
              },
              { upsert: true, new: true }
            )
          } catch (error) {
            console.error("Error storing user data:", error)
          }
        }
      }
      
      return token
    },
    async session({ session, token }) {
      // Add custom fields to session
      if (session.user) {
        session.user.id = token.sub!
        session.user.githubId = token.githubId as string
        session.user.username = token.username as string
        session.user.avatarUrl = token.avatarUrl as string
        session.user.accessToken = token.accessToken as string
      }
      
      return session
    },
    async signIn({ user, account, profile }) {
      // Allow sign in
      return true
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      console.log("User signed in:", user.email)
    },
    async signOut() {
      console.log("User signed out")
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

// Export a version of auth that works in middleware (Edge Runtime)
export const authMiddleware = NextAuth(authConfig).auth
