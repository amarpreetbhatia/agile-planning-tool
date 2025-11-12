# Agile Estimation Poker

A real-time collaborative planning poker application for agile teams, built with Next.js, TypeScript, and MongoDB.

## Features

- GitHub OAuth authentication
- Real-time collaboration with Socket.IO
- GitHub Projects integration
- Planning poker estimation sessions
- Responsive design with Shadcn UI

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 18+, TypeScript
- **UI**: Shadcn UI, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **Authentication**: Auth.js v5 (NextAuth.js)
- **Database**: MongoDB Atlas with Mongoose
- **Real-time**: Socket.IO

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account
- GitHub OAuth App credentials

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and fill in your environment variables:

```bash
cp .env.example .env
```

4. Set up GitHub OAuth App:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create a new OAuth App
   - Set Authorization callback URL to: `http://localhost:3000/api/auth/callback/github`
   - Copy Client ID and Client Secret to your `.env` file

5. Generate secrets for Auth.js:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -base64 32
```

6. Run the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/                    # Next.js App Router pages
├── components/             # React components
│   └── ui/                # Shadcn UI components
├── lib/                   # Utility functions and configurations
├── models/                # MongoDB models
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
└── public/                # Static assets
```

## Environment Variables

See `.env.example` for required environment variables.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT
