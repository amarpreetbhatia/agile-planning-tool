# Agile Planning Tool

A comprehensive real-time collaborative agile planning and estimation tool for distributed teams, built with Next.js, TypeScript, and MongoDB.

## Features

- **Team Collaboration**: Product Owners, Development teams, Operations, and Marketing can all collaborate in shared planning sessions
- **GitHub OAuth Authentication**: Secure login with GitHub accounts
- **Real-time Collaboration**: Live updates with Socket.IO for seamless team interaction
- **GitHub Projects Integration**: Import and manage stories directly from GitHub Projects and Issues
- **Planning Poker Estimation**: Use Fibonacci sequence for accurate story point estimation
- **Session History**: Track and analyze past planning sessions with detailed statistics
- **Export Capabilities**: Download session data in JSON or CSV format
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices with Shadcn UI

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

## Copyright and License

Copyright (c) 2024 [Your Name/Organization]. All Rights Reserved.

This software is made available for **viewing and reference purposes only**.

### ⚠️ Important Restrictions

- ❌ **No Commercial Use** without explicit written permission
- ❌ **No Forking** or downloading for personal/commercial projects
- ❌ **No Distribution** or redistribution of the code
- ✅ **Viewing Only** - You may view and study the code

### Commercial Licensing

Interested in using this software for commercial purposes? Please contact:
- Email: [your-email@example.com]
- Website: [your-website.com]

See the [LICENSE](LICENSE) file for complete terms and conditions.

---

**Note**: This is a proprietary codebase. Unauthorized use, reproduction, or distribution is strictly prohibited.
