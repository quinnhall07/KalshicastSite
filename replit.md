# replit.md

## Overview

This is a weather forecast accuracy tracking application that compares predictions from multiple weather sources against actual observed temperatures. The system allows users to add locations (weather stations), record forecasts from various sources (like NOAA, AccuWeather, GFS, ECMWF), and track actual observations to measure forecast accuracy over time. The dashboard displays accuracy metrics using interactive line charts and statistics cards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme (data-heavy technical aesthetic)
- **Charts**: Recharts for data visualization (line charts for forecast accuracy)
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **API Structure**: RESTful endpoints under `/api/*` prefix
- **Route Definitions**: Centralized in `shared/routes.ts` with Zod schemas for type-safe API contracts

### Data Storage Solutions
- **Primary Database**: Supabase (PostgreSQL-based)
  - Tables: `stations`, `sources`, `forecasts`, `observations`
  - Accessed via `@supabase/supabase-js` client
- **ORM/Schema**: Drizzle ORM with PostgreSQL dialect
  - Schema defined in `shared/schema.ts`
  - Local tables: `locations`, `forecasts`, `observations`
- **Connection**: Uses `DATABASE_URL` environment variable for Drizzle, Supabase credentials for direct Supabase access

### Build and Development
- **Development**: `tsx` for running TypeScript directly
- **Production Build**: 
  - Client: Vite builds to `dist/public`
  - Server: esbuild bundles to `dist/index.cjs`
  - Selective dependency bundling for faster cold starts
- **Database Migrations**: Drizzle Kit with `db:push` command

### Key Design Patterns
- **Shared Types**: Common schemas and types in `shared/` directory accessible to both client and server
- **Type-safe API**: Zod schemas define request/response types in route definitions
- **Storage Abstraction**: `server/storage.ts` provides a unified interface over Supabase data

## External Dependencies

### Database & Backend Services
- **Supabase**: Primary data storage for weather stations, forecasts, and observations
  - Required env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`)
- **PostgreSQL**: Direct database access via `DATABASE_URL` for Drizzle ORM operations

### Frontend Libraries
- **Radix UI**: Full suite of accessible UI primitives (dialogs, dropdowns, tooltips, etc.)
- **Recharts**: Charting library for accuracy visualizations
- **date-fns**: Date manipulation and formatting

### Development Tools
- **Replit Plugins**: Development banner, cartographer, runtime error overlay (development only)