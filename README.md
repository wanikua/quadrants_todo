# Quadrants

A minimal task management application using the Eisenhower Matrix.

## Overview

Quadrants helps you prioritize tasks by urgency and importance. Built with Next.js, PostgreSQL, and AI-powered task organization.

## Key Features

- Eisenhower Matrix visualization (urgent/important quadrants)
- AI-powered task prioritization with Qwen API
- Real-time collaboration for team projects
- Drag-and-drop task management
- Bulk task creation with natural language
- Personal and team project support

## Tech Stack

- Next.js 15 with App Router
- React 19 and TypeScript
- Neon PostgreSQL
- Clerk Authentication
- Stripe for payments
- Tailwind CSS and shadcn/ui

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run development server
pnpm dev
```

Visit `http://localhost:3000`

## Environment Variables

Required variables:

- `DATABASE_URL` - Neon PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `QWEN_API_KEY` - Qwen API key for AI features
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NEXT_PUBLIC_APP_URL` - Application URL

## Project Structure

```
app/                    # Next.js app directory
  actions.ts           # Server actions
  client.tsx           # Main client component
  db/                  # Database layer
  api/                 # API routes
components/            # React components
lib/                   # Shared utilities
styles/                # Global styles
```

## License

MIT
