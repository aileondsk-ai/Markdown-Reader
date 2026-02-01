# StyleFinder AI

## Overview

StyleFinder AI is a Korean-language fashion personality assessment and AI styling platform. Users can take a "Style Identity Type" (SIT) test similar to MBTI to discover their fashion personality across 16 types, then receive AI-powered outfit evaluations from virtual fashion personas. The application features Replit Auth for user management, PostgreSQL for data persistence, and OpenAI integration for fashion analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Charts**: Recharts for radar chart visualizations in assessment results
- **Build Tool**: Vite with path aliases (`@/` for client, `@shared/` for shared code)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Design**: Type-safe route definitions in `shared/routes.ts` using Zod schemas
- **Authentication**: Replit Auth with OpenID Connect via Passport.js
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` with models split into `shared/models/`
- **Key Tables**:
  - `users` and `sessions` (Replit Auth - do not modify)
  - `sit_results` - Style Identity Type test results with JSON scores
  - `assessments` - AI fashion evaluations with persona, scores, feedback, and isFavorite flag
  - `conversations` and `messages` - Chat history for AI interactions
  - `recommendations` - TPO-based outfit recommendations with outfitSet, reasoning, alternatives

### AI Integration
- **Provider**: OpenAI via Replit AI Integrations
- **Capabilities**: Image analysis for fashion evaluation, text generation for feedback
- **Client Location**: `server/replit_integrations/image/client.ts`

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components (shadcn/ui based)
    pages/        # Route pages (Home, Test, Evaluate, Profile, History, Progress, Chat, Recommend)
    hooks/        # React Query hooks for API calls
    lib/          # Utilities and SIT type definitions
server/           # Express backend
  replit_integrations/  # Pre-built integrations (auth, chat, image, audio)
  routes.ts       # API route handlers
  storage.ts      # Database operations interface
shared/           # Shared between client and server
  schema.ts       # Drizzle schema definitions
  routes.ts       # Type-safe API route contracts
  models/         # Reusable model definitions
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database accessed via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema management with `drizzle-kit push` for migrations

### Authentication
- **Replit Auth**: OpenID Connect provider requiring `ISSUER_URL`, `REPL_ID`, and `SESSION_SECRET`
- Session data stored in PostgreSQL `sessions` table

### AI Services
- **OpenAI API**: Accessed through Replit AI Integrations
- Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
- Used for image generation (`gpt-image-1`) and fashion analysis

### Third-Party Libraries
- **shadcn/ui**: Pre-styled Radix UI components with Tailwind
- **Recharts**: Data visualization for assessment radar charts
- **react-dropzone**: Image upload functionality
- **date-fns**: Date formatting with Korean locale support