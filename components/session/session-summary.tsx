'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';
import { SessionSummary as SessionSummaryType } from '@/app/api/sessions/[sessionId]/end/route';

interface SessionSummaryProps {
  summary: SessionSummaryType;
}

export function SessionSummary({ summary }: SessionSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Session Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Session Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold">{summary.sessionName}</h3>
            <p className="text-sm text-muted-foreground">
              Session ID: {summary.sessionId}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm">Participants</span>
              </div>
              <p className="text-2xl font-bold">{summary.participantCount}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Stories Estimated</span>
              </div>
              <p className="text-2xl font-bold">{summary.estimatedStories.length}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Total Stories</span>
              </div>
              <p className="text-2xl font-bold">{summary.totalStories}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Ended</span>
              </div>
              <p className="text-sm font-medium">
                {new Date(summary.endedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estimated Stories */}
      <Card>
        <CardHeader>
          <CardTitle>Estimated Stories</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.estimatedStories.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No stories were estimated in this session.
            </p>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {summary.estimatedStories.map((story, index) => (
                  <div key={story.storyId} className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            #{index + 1}
                          </span>
                          <h4 className="font-semibold">{story.storyTitle}</h4>
                        </div>
                      </div>
                      {story.finalEstimate !== undefined && (
                        <Badge variant="default" className="text-lg px-3 py-1">
                          {story.finalEstimate}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Average:</span>
                        <span className="ml-2 font-medium">{story.average}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Min:</span>
                        <span className="ml-2 font-medium">{story.min}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Max:</span>
                        <span className="ml-2 font-medium">{story.max}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {story.votes.map((vote, voteIndex) => (
                        <div
                          key={voteIndex}
                          className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded"
                        >
                          <span className="font-medium">{vote.username}:</span>
                          <span>{vote.value}</span>
                        </div>
                      ))}
                    </div>

                    {index < summary.estimatedStories.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
