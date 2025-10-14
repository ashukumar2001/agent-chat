# Project Structure Guide

Version: 1.0.0

Complete guide to the project architecture and organization for this Cloudflare Workers + Agents + React with Vite application.

## Project Overview

This is a full-stack application built with:

- **Frontend**: React 19 with Vite, TanStack Router, TailwindCSS 4.x, and Shadcn/ui components
- **Backend**: Cloudflare Workers with Hono framework
- **AI Integration**: Cloudflare Agents with Durable Objects
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Authentication**: Better Auth
- **API Layer**: tRPC for type-safe API communication

## Directory Structure

```
project-root/
├── .cursor/rules/           # Cursor IDE rules and guidelines
├── .wrangler/              # Wrangler build artifacts (auto-generated)
├── node_modules/           # Dependencies
├── public/                 # Static assets served by Cloudflare Workers
├── src/
│   ├── react-app/         # React frontend application
│   │   ├── components/    # Reusable React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/          # Frontend utilities and configurations
│   │   ├── routes/       # TanStack Router page components
│   │   ├── assets/       # Frontend-specific assets
│   │   ├── index.css     # Global styles with TailwindCSS
│   │   ├── main.tsx      # React app entry point
│   │   └── routeTree.gen.ts # Auto-generated router tree
│   └── worker/            # Cloudflare Workers backend
│       ├── agents/        # AI Agent implementations
│       ├── db/           # Database schemas and migrations
│       ├── drizzle/      # Drizzle ORM configuration and migrations
│       ├── lib/          # Backend utilities and configurations
│       ├── routes/       # tRPC API route handlers
│       ├── index.ts      # Worker entry point
│       └── trpc.ts       # tRPC configuration
├── auth-schema.ts         # Better Auth schema definitions
├── drizzle.config.ts      # Drizzle ORM configuration
├── wrangler.json          # Cloudflare Workers configuration
├── vite.config.ts         # Vite build configuration
├── package.json           # Project dependencies and scripts
└── tsconfig.*.json        # TypeScript configurations
```

## Key Configuration Files

### [wrangler.json](mdc:wrangler.json)

Main configuration for Cloudflare Workers deployment:

- Defines environments (dev/prod)
- Configures Durable Objects bindings for Agents
- Sets up D1 database bindings
- Configures AI binding for Cloudflare AI models
- Manages environment variables and secrets

### [vite.config.ts](mdc:vite.config.ts)

Vite build configuration:

- React plugin with React Compiler support
- TanStack Router plugin for file-based routing
- TailwindCSS 4.x integration
- Cloudflare Vite plugin for Workers integration
- Path aliases for clean imports

### [package.json](mdc:package.json)

Dependency management and build scripts:

- Production dependencies include React 19, Hono, Agents framework
- Development dependencies include Wrangler, Vite, TypeScript
- Scripts for dev, build, deploy, and database operations

### [drizzle.config.ts](mdc:drizzle.config.ts)

Database ORM configuration:

- Configures Drizzle for Cloudflare D1
- Sets migration directories and schema files
- Environment-specific database connections

## Entry Points

### Frontend: [src/react-app/main.tsx](mdc:src/react-app/main.tsx)

React application initialization:

- Sets up TanStack Router
- Configures tRPC client
- Initializes authentication context

### Backend: [src/worker/index.ts](mdc:src/worker/index.ts)

Cloudflare Worker entry point:

- Exports Durable Object classes for Agents
- Sets up Hono app with middleware
- Configures tRPC server
- Handles authentication routes
- Routes agent requests

## Import Aliases

Configured in `vite.config.ts` for clean imports:

- `@/*` → `./src/react-app/*` (Frontend components and utilities)
- `@worker/*` → `./src/worker/*` (Backend Worker code)

Example usage:

```typescript
import { Button } from "@/components/ui/button";
import { auth } from "@worker/lib/auth";
```

## Environment Configuration

The project supports multiple environments through `wrangler.json`:

- **dev**: Development environment with local D1 database
- **prod**: Production environment with production database

Environment-specific variables are stored in:

- `.dev.vars.dev` - Development environment variables
- `.dev.vars.prod` - Production environment variables

## Build Process

1. **Development**: `npm run dev`
   - Starts Vite dev server for React app
   - Runs Cloudflare Workers locally with Wrangler
   - Hot reloading for both frontend and backend

2. **Production Build**: `npm run build:prod`
   - TypeScript compilation
   - Vite production build
   - Wrangler bundling for Workers

3. **Deployment**: `npm run deploy:prod`
   - Builds the application
   - Deploys to Cloudflare Workers
   - Applies database migrations

## Database Workflow

Using Drizzle ORM with Cloudflare D1:

1. `npm run db:generate` - Generate migration files from schema
2. `npm run db:push` - Push schema changes to database
3. `npm run db:migrate:dev` - Apply migrations to dev environment
4. `npm run db:migrate:prod` - Apply migrations to production
5. `npm run db:studio` - Open Drizzle Studio for database management

## Agent Architecture

Agents are implemented as Durable Objects:

- Each agent class extends the base `Agent` from the `agents` framework
- State is persisted automatically via Durable Objects
- WebSocket connections enable real-time communication
- Agents can be accessed via HTTP routes or WebSocket connections
