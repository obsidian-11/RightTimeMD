# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RightTimeMD is a multi-sided healthcare platform connecting providers, patients, and insurance companies through FHIR data integration. The goal is to coordinate care while reducing administrative friction.

## Architecture

- **Frontend**: React + Vite + TypeScript + TailwindCSS + Jotai state management
- **Backend**: Node.js + Express + TypeScript 
- **Database**: Supabase PostgreSQL with FHIR-optimized schema
- **Authentication**: Supabase Auth

## Development Commands

### Frontend (in `/frontend/`)
- `npm run dev` - Start development server
- `npm run build` - Build for production (runs TypeScript compiler then Vite build)
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Backend (in `/backend/`)
- `npm run dev` - Start development server with hot reload (tsx watch)
- `npm run build` - Compile TypeScript to JavaScript
- `npm test` - Run tests (currently not implemented)

## Key Technologies & Patterns

### Frontend Structure
- **Path Aliases**: Configured in `vite.config.ts` and `tsconfig.json`
  - `@/` → `src/`
  - `@pages` → `src/pages`
  - `@components` → `src/components`
  - `@hooks` → `src/hooks`
  - `@state` → `src/state`
  - `@supa` → `src/lib/supabase.ts`

- **State Management**: Jotai atoms for authentication state
- **Routing**: React Router v7 for client-side routing
- **Styling**: TailwindCSS v4 with custom configuration

### Authentication Flow
- Uses Supabase Auth with session management
- `useAuth` hook provides auth state and methods (`signIn`, `signUp`, `signOut`)
- Authentication state stored in Jotai atoms (`userAtom`, `sessionAtom`)

### Database Schema
- HIPAA-compliant design with Row Level Security (RLS)
- Multi-tenant architecture with clinic isolation
- FHIR resources stored as JSONB in dedicated table
- Key tables: `clinic`, `staff`, `patient`, `fhir`, `appointment`, `audit_log`

### Backend API
- Express server with CORS enabled
- Supabase client for database operations
- Generic endpoints for data upload (`/upload`) and retrieval (`/data/:table`)
- Environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

## Environment Setup

Both frontend and backend require Supabase environment variables:
- Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Backend: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

## Project Goals

1. FHIR data visualization
2. FHIR CRUD operations with update notifications
3. Appointment management
4. AI-powered doctor-patient chat assistance