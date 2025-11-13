# App Ipê - Real Estate Management System

## Overview

App Ipê is a comprehensive real estate management application built as a Progressive Web App (PWA) with a focus on financial control and property transactions. The system manages a single property transaction between owners and buyers, tracking installment payments, rent payments, and condominium fees. It features role-based access control with two user types: Proprietário (Owner) with full administrative access, and Comprador (Buyer) with read-only access.

The application is designed with a mobile-first approach, implementing Material Design principles with Linear-inspired minimalism for optimal data presentation and user experience across devices.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18+ with TypeScript for type safety
- Vite as the build tool and development server
- Single Page Application (SPA) architecture using Wouter for client-side routing
- Progressive Web App with service worker for offline capabilities

**Component System:**
- shadcn/ui component library (New York style) with Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Class Variance Authority (CVA) for component variant management
- Custom spacing primitives (2, 4, 6, 8, 12, 16 units) for consistent layout

**Design System:**
- Typography: Inter for UI elements, JetBrains Mono for financial values and data
- Responsive grid: 12-column on desktop, single column on mobile
- Mobile-first breakpoint at 768px
- Custom color palette with HSL-based theming system supporting light/dark modes

**State Management:**
- TanStack Query (React Query) for server state management
- React Context API for authentication state
- Local state with React hooks for UI interactions

**Key UI Patterns:**
- File upload component with validation (max 3 files, 5MB each, specific file types)
- Protected routes with authentication middleware
- Form handling with React Hook Form and Zod validation
- Toast notifications for user feedback
- Chart.js integration for financial data visualization

### Backend Architecture

**Server Framework:**
- Express.js as the REST API server
- TypeScript for type safety across the stack
- Serves both API endpoints (`/api/*`) and static frontend assets in production

**API Design:**
- RESTful endpoints organized by domain (auth, partes, imovel, parcelas, alugueis, condominios)
- JWT-based authentication with 7-day token expiration
- Role-based authorization middleware (Proprietário vs Comprador)
- Request/response logging with duration tracking

**Authentication & Authorization:**
- JWT tokens stored in localStorage on client
- Bcrypt for password hashing (10 salt rounds)
- Bearer token authentication via Authorization header
- Middleware enforces role-based permissions on write operations
- Read-only access for Comprador role across all financial data

**File Handling:**
- Multer for multipart/form-data file uploads
- Custom validation for file types, sizes, and counts
- File metadata stored in database with path references
- Files organized by entity type (parte, imovel, parcela)
- Supported formats: pdf, zip, jpeg, jpg, png, doc, docx, rtf

### Data Storage

**Database:**
- SQLite with better-sqlite3 driver for synchronous operations
- Write-Ahead Logging (WAL) mode for improved concurrency
- Foreign key constraints enabled
- Database seeding on initialization with sample data

**Schema Design:**
- `usuarios`: User accounts with role-based access (Proprietário/Comprador)
- `partes`: People involved in transactions (owners and buyers)
- `imoveis`: Single property with financial details
- `parcelas`: Installment payments with payment tracking
- `alugueis`: Monthly rent payments
- `condominios`: Monthly condominium fees
- `arquivos`: File metadata for all uploaded documents

**Data Validation:**
- Drizzle ORM schema definitions with Zod for runtime validation
- TypeScript types derived from database schema
- Shared schema between client and server for type consistency

### External Dependencies

**Core Framework Dependencies:**
- `express`: Web server framework
- `better-sqlite3`: SQLite database driver
- `drizzle-orm`: TypeScript ORM for database operations
- `drizzle-kit`: Database migration toolkit

**Authentication & Security:**
- `jsonwebtoken`: JWT token generation and verification
- `bcrypt`: Password hashing

**Frontend Libraries:**
- `react`, `react-dom`: UI framework
- `@tanstack/react-query`: Server state management
- `wouter`: Lightweight routing
- `react-hook-form`: Form state management
- `@hookform/resolvers`: Form validation integration
- `zod`: Schema validation

**UI Component Libraries:**
- `@radix-ui/*`: Unstyled accessible components (accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, label, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, switch, tabs, toast, tooltip)
- `lucide-react`: Icon library
- `chart.js`: Data visualization
- `react-chartjs-2`: React wrapper for Chart.js

**Styling:**
- `tailwindcss`: Utility-first CSS framework
- `autoprefixer`: PostCSS plugin for vendor prefixes
- `class-variance-authority`: Component variant utilities
- `tailwind-merge`: Utility for merging Tailwind classes
- `clsx`: Conditional className utility

**File Handling:**
- `multer`: Multipart form data parsing for file uploads

**Development Tools:**
- `vite`: Build tool and dev server
- `@vitejs/plugin-react`: React plugin for Vite
- `typescript`: Type checking
- `tsx`: TypeScript execution for Node.js
- `esbuild`: Server bundle creation for production
- `@replit/vite-plugin-*`: Replit-specific development plugins

**Database:**
- PostgreSQL configuration present via `@neondatabase/serverless` and Drizzle config, though currently using SQLite (the system is designed to potentially migrate to Postgres later)

**PWA Features:**
- Custom service worker for offline caching
- Web manifest for installability
- Favicon and app icons
- Offline-first strategy for static assets