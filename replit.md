# Overview

FemCare is a comprehensive women's health tracking application built as a full-stack web application. The system provides medication management, cycle tracking, and health journaling capabilities tailored specifically for women's healthcare needs. The application features medication reminders based on menstrual cycle phases, daily health journaling with mood and symptom tracking, and a calendar view for comprehensive health data visualization.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built with React and TypeScript using Vite as the build tool. The application uses a component-based architecture with:
- **Routing**: Wouter for lightweight client-side routing with four main pages (Home, Medications, Calendar, Journal)
- **State Management**: TanStack Query for server state management and caching
- **UI Framework**: Radix UI components with shadcn/ui design system for consistent, accessible components
- **Styling**: Tailwind CSS with custom CSS variables for theming, supporting both light and dark modes
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
The server follows a RESTful API design using Express.js:
- **Server Framework**: Express.js with TypeScript for type safety
- **API Design**: RESTful endpoints organized by resource (medications, logs, journal entries, cycle tracking)
- **Validation**: Zod schemas shared between client and server for consistent data validation
- **Storage Layer**: Abstracted storage interface allowing for different implementations (currently in-memory storage)
- **Development Tools**: Vite integration for hot module replacement in development

## Data Storage Solutions
The application uses a flexible storage architecture:
- **Database**: PostgreSQL configured through Drizzle ORM with support for Neon serverless database
- **Schema Management**: Drizzle Kit for database migrations and schema management
- **Storage Interface**: Abstract IStorage interface allowing for multiple storage backends (MemStorage for development, database storage for production)
- **Data Models**: Comprehensive schemas for medications, medication logs, journal entries, and cycle tracking

## Authentication and Authorization
Currently, the application does not implement authentication, suggesting it's designed for single-user or development use. The architecture supports adding authentication through middleware patterns.

## External Dependencies
- **UI Components**: Extensive use of Radix UI primitives for accessible, unstyled components
- **Database**: Neon serverless PostgreSQL for cloud-based data persistence
- **Development**: Replit-specific tooling for development environment integration
- **Form Validation**: Zod for runtime type checking and validation
- **Date Handling**: date-fns for date calculations and formatting
- **Icons**: Lucide React for consistent iconography

The architecture prioritizes type safety, component reusability, and maintainability while providing a smooth development experience through hot reloading and integrated tooling.