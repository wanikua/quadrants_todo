# Quadrant Task Manager

A task management application using the Eisenhower Matrix (Urgent/Important quadrants) built with Next.js 15, Neon PostgreSQL, and custom JWT authentication.

## Features

- 🔐 Custom JWT authentication with bcrypt password hashing
- 📊 Eisenhower Matrix task organization (4 quadrants)
- 🗂️ Project-based task management
- 💳 Stripe subscription integration
- 🎨 Modern UI with Tailwind CSS and shadcn/ui
- 🔒 Row Level Security (RLS) with Neon PostgreSQL

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Database**: Neon PostgreSQL with RLS
- **Authentication**: Custom JWT with jose library
- **Payments**: Stripe
- **Styling**: Tailwind CSS, shadcn/ui
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Neon PostgreSQL database
- Stripe account (for payments)

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables (see `.env.example`)

4. Run database migrations:
   \`\`\`bash
   npm run db:setup
   \`\`\`

5. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Authentication

This app uses custom JWT authentication:
- Passwords are hashed with bcrypt
- JWTs are signed with jose library
- Tokens stored in HTTP-only cookies
- 30-day token expiration

## Database Schema

Key tables:
- `users` - User accounts with password hashes
- `projects` - User projects
- `tasks` - Tasks with quadrant assignment
- `promo_codes` - Promotional codes for subscriptions

## License

MIT
