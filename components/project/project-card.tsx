'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, Clock, ArrowRight, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { IProject, ProjectRole } from '@/types';

interface ProjectCardProps {
  project: IProject;
  userRole: ProjectRole;
}

export default function ProjectCard({ project, userRole }: ProjectCardProps) {
  const displayMembers = project.members.slice(0, 3);
  const remainingCount = project.members.length - 3;

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="hover:shadow-lg transition-shadow h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                <Badge variant={getRoleBadgeVariant(userRole)}>
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {project.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {project.members.length} {project.members.length === 1 ? 'member' : 'members'}
              </span>
            </div>

            <div className="flex -space-x-2">
              {displayMembers.map((member, index) => (
                <motion.div
                  key={member.userId.toString()}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={member.avatarUrl} alt={member.username} />
                    <AvatarFallback>
                      {member.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              ))}
              {remainingCount > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 + displayMembers.length * 0.05 }}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium"
                >
                  +{remainingCount}
                </motion.div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href={`/projects/${project.projectId}`}>
                View Project
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {(userRole === 'owner' || userRole === 'admin') && (
              <Button asChild variant="outline" size="icon">
                <Link href={`/projects/${project.projectId}/settings`}>
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
