# QuickCopy File Management System

## Overview

QuickCopy is a modern file management dashboard built for tracking and managing student file submissions. The application provides an admin interface for monitoring file uploads, generating download tokens, and sending notifications to students. It features a clean, responsive UI built with React and a robust backend API for file operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React SPA**: Built with React 18 using TypeScript for type safety
- **UI Framework**: Implements shadcn/ui component library with Radix UI primitives
- **Styling**: Uses Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: Leverages TanStack Query for server state management and caching
- **Routing**: Uses Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Express.js Server**: RESTful API server with TypeScript support
- **Database ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Storage Layer**: Abstracted storage interface supporting both memory and database implementations
- **Session Management**: Express sessions with PostgreSQL store using connect-pg-simple
- **Development Integration**: Custom Vite middleware for seamless full-stack development

### Data Layer
- **Database Schema**: Three main entities - users, files, and notifications
- **File Tracking**: Comprehensive file metadata including student info, upload dates, and status tracking
- **Token System**: Secure download token generation for file access control
- **Notification System**: Automated notification tracking for student communications

### Authentication & Authorization
- **Simple Authentication**: Username/password login system with session-based auth
- **Role-Based Access**: Admin role system for controlling access to management features
- **Default Credentials**: Bootstrapped with admin/admin123 for initial access

### API Design
- **RESTful Endpoints**: Clear resource-based API structure for files, auth, and notifications
- **Error Handling**: Centralized error handling with consistent response formats
- **Request Logging**: Detailed API request logging with response times and payload tracking
- **Validation**: Zod schema validation for request data integrity

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection for Neon cloud database
- **drizzle-orm & drizzle-kit**: Type-safe ORM and migration toolkit
- **@tanstack/react-query**: Server state management and caching
- **express**: Web application framework for Node.js

### UI Component Libraries
- **@radix-ui/***: Comprehensive set of unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Utility for creating variant-based component APIs
- **lucide-react**: Modern icon library

### Development Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution engine for Node.js
- **@replit/vite-plugin-***: Replit-specific development enhancements

### Validation & Forms
- **zod**: TypeScript schema validation
- **react-hook-form**: Performant forms with easy validation
- **@hookform/resolvers**: Validation resolver for react-hook-form

### Utility Libraries
- **date-fns**: Modern date utility library
- **clsx**: Utility for constructing className strings
- **nanoid**: Secure URL-friendly unique ID generator