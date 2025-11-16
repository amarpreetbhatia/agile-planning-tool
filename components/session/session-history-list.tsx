'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Users, CheckCircle, TrendingUp, Eye } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface SessionHistoryItem {
  _id: string;
  sessionId: string;
  name: string;
  status: 'active' | 'archived';
  hostId: string;
  isHost: boolean;
  participantCount: number;
  participants: Array<{
    userId: string;
    username: string;
    avatarUrl: string;
    joinedAt: string;
  }>;
  githubIntegration?: {
    repoOwner: string;
    repoName: string;
  };
  createdAt: string;
  updatedAt: string;
  statistics: {
    totalStories: number;
    completedStories: number;
    totalEstimatePoints: number;
    avgVotesPerStory: number;
  };
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export default function SessionHistoryList() {
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });
  const [status, setStatus] = useState<string>('archived');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
  }, [status, sortBy, sortOrder, pagination.offset]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status,
        sortBy,
        sortOrder,
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      });

      const response = await fetch(`/api/sessions/history?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch session history');
      }

      const data = await response.json();
      setSessions(data.sessions);
      setPagination(data.pagination);
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

  const handleLoadMore = () => {
    setPagination((prev) => ({
      ...prev,
      offset: prev.offset + prev.limit,
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">Last Updated</SelectItem>
              <SelectItem value="createdAt">Created Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descending</SelectItem>
              <SelectItem value="asc">Ascending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          {pagination.total} session{pagination.total !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Session List */}
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No sessions found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or create a new session
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {session.name}
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
                      Created {formatDate(session.createdAt)} • Updated{' '}
                      {formatDate(session.updatedAt)}
                    </CardDescription>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/history/${session.sessionId}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{session.participantCount}</p>
                      <p className="text-xs text-muted-foreground">Participants</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {session.statistics.completedStories} / {session.statistics.totalStories}
                      </p>
                      <p className="text-xs text-muted-foreground">Stories Completed</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {session.statistics.totalEstimatePoints}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Points</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {session.statistics.avgVotesPerStory}
                      </p>
                      <p className="text-xs text-muted-foreground">Avg Votes/Story</p>
                    </div>
                  </div>
                </div>

                {session.githubIntegration && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      GitHub: {session.githubIntegration.repoOwner}/
                      {session.githubIntegration.repoName}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Load More */}
      {pagination.hasMore && (
        <div className="flex justify-center">
          <Button onClick={handleLoadMore} variant="outline" disabled={loading}>
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
