# GitHub Integration Components

This directory contains all the UI components for GitHub integration functionality in the Agile Estimation Poker application.

## Components

### GitHubIntegrationDialog
Main dialog component that orchestrates the GitHub integration flow. Allows session hosts to import issues from GitHub repositories or projects.

**Features:**
- Tab-based interface for repository issues vs. GitHub Projects
- Repository selection with search
- Issue selection with pagination
- Story preview before import
- Error handling and retry logic

**Usage:**
```tsx
<GitHubIntegrationDialog
  sessionId={sessionId}
  isHost={isHost}
  onStoryImport={(data) => console.log('Stories imported:', data)}
/>
```

### RepositorySelector
Dropdown component for selecting a GitHub repository with search functionality.

**Features:**
- Fetches user's accessible repositories
- Search/filter repositories by name or description
- Loading and error states
- Retry functionality on errors

### IssueList
Displays a paginated list of issues from a selected repository with multi-select functionality.

**Features:**
- Checkbox selection for multiple issues
- Pagination support
- Select/deselect all functionality
- Issue details preview (title, description, labels)
- External link to GitHub issue
- Support for both repository issues and project items

### ProjectSelector
Dropdown for selecting a GitHub Project (V2) from a repository owner.

**Features:**
- Fetches GitHub Projects for an owner
- Optional selection (can import directly from repo)
- Loading and error states
- Retry functionality

### StoryPreview
Preview component showing selected issues before import.

**Features:**
- Scrollable list of selected stories
- Issue details display
- External links to GitHub
- Label display

### ImportedStoriesList
Displays stories that have been imported into the session.

**Features:**
- Shows all GitHub-imported stories
- Story selection for estimation
- External links to original GitHub issues
- Visual indication of selected story

## API Routes

The components interact with the following API routes:

- `GET /api/github/repositories` - Fetch user's repositories
- `GET /api/github/issues` - Fetch issues from a repository
- `GET /api/github/projects` - Fetch GitHub Projects for an owner
- `POST /api/sessions/[sessionId]/github/import` - Import stories into session

## Error Handling

All components include comprehensive error handling for:
- GitHub API rate limits
- Invalid/expired access tokens
- Network failures
- Missing permissions
- Not found errors

Errors are displayed inline with retry options and user-friendly messages.

## Requirements Covered

This implementation covers the following requirements:
- 4.1: GitHub project integration option for session hosts
- 4.2: GitHub Projects API access
- 4.3: Retrieve accessible GitHub projects
- 4.4: Fetch project issues and stories
- 4.5: Display imported stories in session interface

## Future Enhancements

- Caching of repository and project data
- Bulk operations for large issue lists
- Advanced filtering (by label, milestone, assignee)
- Real-time sync with GitHub
- Support for GitHub Enterprise
