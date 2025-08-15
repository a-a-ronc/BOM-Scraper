# Overview

This is a full-stack document processing application called "Intralog Prelim → BOM" built for engineering teams in the warehousing and storage industry. The system allows users to upload rack engineering drawings (PDFs), extract project specifications automatically, and generate Bill of Materials (BOM) for multiple vendors. The application follows a monorepo architecture with a React frontend, Express.js backend, and PostgreSQL database.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript, built using Vite for fast development and optimized builds
- **UI Library**: Radix UI components with shadcn/ui for consistent, accessible design system
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas for type-safe forms

## Backend Architecture
- **Runtime**: Node.js with TypeScript using ES modules
- **Framework**: Express.js with session-based authentication
- **Database ORM**: Drizzle ORM with PostgreSQL for type-safe database operations
- **File Handling**: Multer for PDF file uploads with validation
- **Authentication**: Session-based auth with bcrypt password hashing
- **Development**: Hot reloading with tsx for development server

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon Database cloud hosting
- **ORM**: Drizzle ORM providing type-safe queries and schema migrations
- **File Storage**: Local filesystem storage for uploaded PDFs
- **Session Storage**: Express sessions with connect-pg-simple for PostgreSQL session store

## Authentication and Authorization
- **Strategy**: Session-based authentication using express-session
- **Password Security**: bcrypt for hashing and salting passwords
- **Session Management**: PostgreSQL-backed session storage with configurable expiration
- **Access Control**: Route-level protection with authentication middleware

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle Kit**: Database migration and schema management tool

### Development Tools
- **Replit Integration**: Custom Vite plugins for Replit development environment
- **Build Tools**: esbuild for fast server-side bundling, Vite for client builds
- **TypeScript**: Full-stack type safety with shared types in `/shared` directory

### UI Components and Styling
- **Radix UI**: Headless, accessible UI primitives for complex components
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Consistent icon library with React components

### Document Processing
- **File Upload**: Multer middleware for handling multipart/form-data PDF uploads
- **Mock PDF Processing**: Placeholder service architecture for future PDF parsing integration
- **Rules Engine**: JSON-based configuration system for BOM calculations and vendor mapping

The application is designed with a modular architecture that allows for easy extension with additional features like OneRack preliminary calculations, RFQ management, and integration with external systems like Odoo ERP.