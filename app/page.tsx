import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Users, Github, TrendingUp, Plus } from "lucide-react"
import SessionList from "@/components/session/session-list"
import connectDB from "@/lib/db"
import Session from "@/models/Session"
import User from "@/models/User"

export default async function Home() {
  const session = await auth()

  // If authenticated, show dashboard
  if (session?.user) {
    // Fetch user's sessions
    await connectDB()
    const user = await User.findOne({ githubId: session.user.githubId })
    
    let activeSessions: Array<{
      _id: string;
      sessionId: string;
      name: string;
      hostId: string;
      status: 'active' | 'archived';
      participantCount: number;
      participants: Array<{
        userId: string;
        username: string;
        avatarUrl: string;
        isOnline: boolean;
      }>;
      currentStory?: {
        title: string;
      };
      updatedAt: string;
      isHost: boolean;
    }> = []
    let archivedSessionCount = 0
    
    if (user) {
      const sessions = await Session.find({
        $or: [
          { hostId: user._id },
          { 'participants.userId': user._id },
        ],
      })
        .sort({ updatedAt: -1 })
        .lean()

      activeSessions = sessions
        .filter((s) => s.status === 'active')
        .map((s) => ({
          _id: s._id.toString(),
          sessionId: s.sessionId,
          name: s.name,
          hostId: s.hostId.toString(),
          status: s.status as 'active' | 'archived',
          participantCount: s.participants.length,
          participants: s.participants.map((p) => ({
            userId: p.userId.toString(),
            username: p.username,
            avatarUrl: p.avatarUrl,
            isOnline: p.isOnline,
          })),
          currentStory: s.currentStory,
          updatedAt: s.updatedAt.toISOString(),
          isHost: s.hostId.toString() === user._id.toString(),
        }))

      archivedSessionCount = sessions.filter((s) => s.status === 'archived').length
    }

    return (
      <main className="container py-8">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {session.user.username || session.user.name}!
              </p>
            </div>
            <Button asChild>
              <Link href="/sessions/new">
                <Plus className="mr-2 h-4 w-4" />
                New Session
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                  Your ongoing estimation sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{activeSessions.length}</p>
                <p className="text-xs text-muted-foreground">sessions active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Completed</CardTitle>
                <CardDescription>
                  Total sessions completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{archivedSessionCount}</p>
                <p className="text-xs text-muted-foreground">sessions completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Participants</CardTitle>
                <CardDescription>
                  Across all active sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {activeSessions.reduce((sum, s) => sum + s.participantCount, 0)}
                </p>
                <p className="text-xs text-muted-foreground">team members</p>
              </CardContent>
            </Card>
          </div>

          <SessionList sessions={activeSessions} />
        </div>
      </main>
    )
  }

  // Landing page for non-authenticated users
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <div className="container flex max-w-5xl flex-col items-center gap-8 text-center">
        <div className="flex items-center gap-2">
          <Zap className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Agile Estimation Poker
          </h1>
        </div>
        
        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Collaborative planning poker for distributed teams. Estimate user stories in real-time with your team using GitHub integration.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/login">
              <Github className="mr-2 h-5 w-5" />
              Get Started with GitHub
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Real-time Collaboration</h3>
            <p className="text-sm text-muted-foreground">
              Estimate together with your team in real-time
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <Github className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">GitHub Integration</h3>
            <p className="text-sm text-muted-foreground">
              Import stories directly from GitHub Projects
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Planning Poker</h3>
            <p className="text-sm text-muted-foreground">
              Use Fibonacci sequence for accurate estimates
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
