'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Users,
  CheckCircle,
  TrendingUp,
  Download,
  ArrowLeft,
  Github,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface Vote {
  userId: string;
  username: string;
  value: number;
  votedAt: string;
}

interface EstimateDetail {
  _id: string;
  storyId: string;
  story: {
    id: string;
    title: string;
    description: string;
    source: 'manual' | 'github';
    githubIssueNumber?: number;
    githubRepoFullName?: string;
  } | null;
  roundNumber: number;
  votes: Vote[];
  finalEstimate?: number;
  revealedAt?: string;
  finalizedAt?: string;
  createdAt: string;
  statistics: {
    average: number;
    min: number;
    max: number;
    voteCount: number;
  };
}

interface SessionHistoryData {
  session: {
    _id: string;
    sessionId: string;
    name: string;
    status: 'active' | 'archived';
    hostId: string;
    isHost: boolean;
    participants: Array<{
      userId: string;
      username: string;
      avatarUrl: string;
      joinedAt: string;
    }>;
    githubIntegration?: {
      repoOwner: string;
      repoName: string;
      projectNumber?: number;
    };
    createdAt: string;
    updatedAt: string;
  };
  estimates: EstimateDetail[];
  statistics: {
    totalStories: number;
    completedStories: number;
    totalEstimatePoints: number;
    avgEstimateValue: number;
    totalVotes: number;
  };
}

export default function SessionHistoryDetail({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<SessionHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchSessionHistory();
  }, [sessionId]);

  const fetchSessionHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sessions/${sessionId}/history`);

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'Session not found',
            description: 'The session you are looking for does not exist',
            variant: 'destructive',
          });
          router.push('/history');
          return;
        }
        throw new Error('Failed to fetch session history');
      }

      const sessionData = await response.json();
      setData(sessionData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load session history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      setExporting(true);
      const response = await fetch(`/api/sessions/${sessionId}/export?format=${format}`);

      if (!response.ok) {
        throw new Error('Failed to export session data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${sessionId}-export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export successful',
        description: `Session data exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export session data',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium">Session not found</p>
        </CardContent>
      </Card>
    );
  }

  const { session, estimates, statistics } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/history">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{session.name}</h1>
            <p className="text-muted-foreground">Session History & Statistics</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
            disabled={exporting}
          >
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={exporting}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Session Information
            {session.isHost && (
              <Badge variant="secondary" className="text-xs">
                Host
              </Badge>
            )}
            <Badge
              variant={session.status === 'active' ? 'default' : 'outline'}
              className="text-xs"
            >
              {session.status}
            </Badge>
          </CardTitle>
          <CardDescription>
            Created {formatDate(session.createdAt)} • Last updated{' '}
            {formatDate(session.updatedAt)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{session.participants.length}</p>
                <p className="text-xs text-muted-foreground">Participants</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {statistics.completedStories} / {statistics.totalStories}
                </p>
                <p className="text-xs text-muted-foreground">Stories Completed</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{statistics.totalEstimatePoints}</p>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{statistics.avgEstimateValue}</p>
                <p className="text-xs text-muted-foreground">Avg Estimate</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-3">Participants</h4>
            <div className="flex flex-wrap gap-2">
              {session.participants.map((participant) => (
                <div
                  key={participant.userId}
                  className="flex items-center gap-2 rounded-md border px-3 py-2"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={participant.avatarUrl} alt={participant.username} />
                    <AvatarFallback>{participant.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{participant.username}</span>
                </div>
              ))}
            </div>
          </div>

          {session.githubIntegration && (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-sm">
                <Github className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Connected to {session.githubIntegration.repoOwner}/
                  {session.githubIntegration.repoName}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Estimates */}
      <Card>
        <CardHeader>
          <CardTitle>Estimation History</CardTitle>
          <CardDescription>
            All estimates from this session ({estimates.length} round
            {estimates.length !== 1 ? 's' : ''})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {estimates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No estimates recorded in this session
            </p>
          ) : (
            <div className="space-y-6">
              {estimates.map((estimate) => (
                <div key={estimate._id} className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Round {estimate.roundNumber}</Badge>
                        {estimate.story?.source === 'github' && (
                          <Badge variant="secondary" className="text-xs">
                            <Github className="mr-1 h-3 w-3" />
                            GitHub
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium">
                        {estimate.story?.title || 'Unknown Story'}
                      </h4>
                      {estimate.story?.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {estimate.story.description}
                        </p>
                      )}
                    </div>
                    {estimate.finalEstimate !== undefined && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {estimate.finalEstimate}
                        </p>
                        <p className="text-xs text-muted-foreground">Final Estimate</p>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Votes</p>
                      <p className="font-medium">{estimate.statistics.voteCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Average</p>
                      <p className="font-medium">{estimate.statistics.average}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Range</p>
                      <p className="font-medium">
                        {estimate.statistics.min} - {estimate.statistics.max}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">
                        {estimate.finalizedAt
                          ? 'Finalized'
                          : estimate.revealedAt
                          ? 'Revealed'
                          : 'In Progress'}
                      </p>
                    </div>
                  </div>

                  {estimate.votes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Individual Votes</p>
                      <div className="flex flex-wrap gap-2">
                        {estimate.votes.map((vote, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 rounded-md border px-3 py-1.5"
                          >
                            <span className="text-sm">{vote.username}</span>
                            <Badge variant="secondary">{vote.value}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {estimate !== estimates[estimates.length - 1] && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
