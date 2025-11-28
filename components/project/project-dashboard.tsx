'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, Users, Plus, Calendar, Loader2 } from 'lucide-react';
import { IProject, ProjectRole } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import SessionCard from '@/components/session/session-card';
import { useToast } from '@/hooks/use-toast';

interface ProjectDashboardProps {
  project: IProject;
  userRole: ProjectRole;
}

interface Session {
  sessionId: string;
  name: string;
  projectName?: string;
  hostId: string;
  status: 'active' | 'archived';
  participantCount: number;
  participants: Array<{
    username: string;
    avatarUrl: string;
    isOnline: boolean;
  }>;
  currentStory?: {
    title: string;
  };
  updatedAt: string;
}

export default function ProjectDashboard({ project, userRole }: ProjectDashboardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Fetch sessions for this project
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`/api/sessions?projectId=${project._id}&status=active`);
        if (!response.ok) {
          throw new Error('Failed to fetch sessions');
        }
        const data = await response.json();
        setSessions(data.sessions || []);
        
        // Get current user ID from session
        const sessionResponse = await fetch('/api/auth/session');
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          setCurrentUserId(sessionData?.user?.id || '');
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load sessions',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingSessions(false);
      }
    };

    fetchSessions();
  }, [project._id, toast]);

  const getRoleBadgeVariant = (role: ProjectRole) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getCardValuesDisplay = () => {
    switch (project.settings.defaultCardValues) {
      case 'fibonacci':
        return 'Fibonacci (1, 2, 3, 5, 8, 13, 21)';
      case 'tshirt':
        return 'T-Shirt Sizes (XS, S, M, L, XL, XXL)';
      case 'custom':
        return `Custom (${project.settings.customCardValues?.join(', ')})`;
      default:
        return 'Not set';
    }
  };

  const getVotingModeDisplay = () => {
    return project.settings.defaultVotingMode === 'anonymous'
      ? 'Anonymous (votes hidden until reveal)'
      : 'Open (votes visible as cast)';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Badge variant={getRoleBadgeVariant(userRole)}>
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Badge>
          </div>
          <p className="text-muted-foreground">{project.description}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/sessions/new?projectId=${project.projectId}`)}>
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
          {(userRole === 'owner' || userRole === 'admin') && (
            <Button
              variant="outline"
              onClick={() => router.push(`/projects/${project.projectId}/settings`)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>
              {project.members.length} {project.members.length === 1 ? 'member' : 'members'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {project.members.map((member) => (
                <div key={member.userId.toString()} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatarUrl} alt={member.username} />
                      <AvatarFallback>
                        {member.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.username}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getRoleBadgeVariant(member.role)}>
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
            {(userRole === 'owner' || userRole === 'admin') && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push(`/projects/${project.projectId}/members`)}
              >
                <Users className="mr-2 h-4 w-4" />
                Manage Members
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Planning Settings
            </CardTitle>
            <CardDescription>Default settings for new sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Card Values</p>
              <p className="text-sm text-muted-foreground">{getCardValuesDisplay()}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Voting Mode</p>
              <p className="text-sm text-muted-foreground">{getVotingModeDisplay()}</p>
            </div>
            {project.settings.githubIntegration?.defaultRepo && (
              <div>
                <p className="text-sm font-medium mb-1">GitHub Integration</p>
                <p className="text-sm text-muted-foreground">
                  {project.settings.githubIntegration.defaultRepo}
                  {project.settings.githubIntegration.defaultProject &&
                    ` (Project #${project.settings.githubIntegration.defaultProject})`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Sessions
          </CardTitle>
          <CardDescription>Planning sessions for this project</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No sessions yet</p>
              <p className="text-sm mt-1">Create your first session to get started</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => (
                <SessionCard
                  key={session.sessionId}
                  sessionId={session.sessionId}
                  name={session.name}
                  projectName={session.projectName}
                  status={session.status}
                  participantCount={session.participantCount}
                  participants={session.participants}
                  currentStory={session.currentStory}
                  updatedAt={new Date(session.updatedAt)}
                  isHost={session.hostId === currentUserId}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
