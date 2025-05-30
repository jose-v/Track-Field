# Development Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Git
- Supabase account
- OpenAI API key (for chatbot functionality)

## Project Structure

```
track-field-app/
├── web/                    # React web application
├── mobile/                 # Mobile app (future)
├── shared/                 # Shared utilities and types
├── supabase/              # Supabase configuration and functions
├── docs/                  # Documentation
├── migrations/            # Database migrations
└── scripts/               # Utility scripts
```

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd track-field-app
npm install
cd web && npm install
```

### 2. Environment Configuration

Create `.env` files in both root and `web/` directories:

**Root `.env**:**
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

**`web/.env`:**
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

```bash
# Run database migrations
npm run migrate:track-meets

# Check database tables
npm run analyze-db
```

### 4. Start Development Server

```bash
cd web
npm run dev
```

The application will be available at `http://localhost:5174`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run analyze-db` - Analyze database structure

## Development Workflow

1. Create feature branches from `main`
2. Make changes in the appropriate directory (`web/`, `shared/`, etc.)
3. Run tests: `npm test`
4. Commit with descriptive messages
5. Create pull request

## Testing

The project uses Vitest for unit testing and React Testing Library for component testing.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Troubleshooting

### Common Issues

1. **npm command not found**: Ensure nvm is properly configured
2. **Supabase connection errors**: Check environment variables
3. **Build errors**: Clear node_modules and reinstall dependencies

### Getting Help

- Check the [API Documentation](./API.md)
- Review [Database Schema](./DATABASE.md)
- Open an issue on GitHub 