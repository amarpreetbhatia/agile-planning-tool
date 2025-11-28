'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Filter } from 'lucide-react';
import ProjectCard from './project-card';
import { UserInvitations } from './user-invitations';
import { IProject, ProjectRole } from '@/types';
import { getUserRole } from '@/lib/permissions';
import { useSession } from 'next-auth/react';

export default function ProjectsList() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<IProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | ProjectRole>('all');

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, searchQuery, roleFilter, session]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterProjects = () => {
    if (!session?.user) {
      setFilteredProjects([]);
      return;
    }

    let filtered = [...projects];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          project.description.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((project) => {
        const userRole = getUserRole(project, session.user.id);
        return userRole === roleFilter;
      });
    }

    setFilteredProjects(filtered);
  };

  const getUserProjectRole = (project: IProject): ProjectRole => {
    if (!session?.user) return 'member';
    return getUserRole(project, session.user.id) || 'member';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Projects</h1>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button onClick={() => router.push('/projects/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <UserInvitations />

      {projects.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={roleFilter}
              onValueChange={(value: 'all' | ProjectRole) => setRoleFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          {projects.length === 0 ? (
            <>
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first project to start organizing your planning sessions
              </p>
              <Button onClick={() => router.push('/projects/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.projectId}
              project={project}
              userRole={getUserProjectRole(project)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
