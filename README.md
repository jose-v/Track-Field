# Track & Field Training Management System

A comprehensive web application built with React, TypeScript, and Supabase for managing track and field athletes, training plans, and performance tracking.

## Features

### Training Management
- **Monthly Training Plans** - Create, assign, and manage comprehensive monthly training programs
- **Workout Templates** - Build reusable workout templates for consistent training
- **Athlete Progress Tracking** - Monitor athlete completion rates and performance metrics
- **Weekly Timeline Management** - Flexible weekly schedule editing with rest weeks and training weeks

### Athlete Management
- **Coach Portal** - Comprehensive dashboard for managing multiple athletes
- **Athlete Portal** - Personalized interface for athletes to view assignments and track progress
- **Team Organization** - Organize athletes into teams and manage group assignments
- **Performance Analytics** - Track individual and team performance metrics

### AI-Powered Features
- **Chatbot Assistant** - AI-powered assistant for personalized training advice and schedule information
- **Performance Insights** - AI-driven analysis of training data and recommendations
- **Smart Scheduling** - Intelligent workout scheduling based on athlete performance and recovery

### Gamification System
- **Points System** - Award points for completed workouts and achievements
- **Badge Management** - Unlock badges for various milestones and accomplishments
- **Streak Tracking** - Monitor and reward consistent training streaks
- **Leaderboards** - Global and team-based performance leaderboards

## Technology Stack

- **Frontend**: React 18, TypeScript, Chakra UI
- **Backend**: Supabase (PostgreSQL, Edge Functions, Authentication)
- **AI Integration**: OpenAI GPT models
- **Build Tool**: Vite
- **Testing**: Jest, React Testing Library

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd track-and-field
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Add your Supabase credentials
```

4. Start the development server:
```bash
npm run dev
```

## Testing

The application includes comprehensive testing coverage:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage

- **Gamification System** - Complete unit test coverage for points, badges, streaks, and leaderboards
- **API Services** - Tests for all data access and API integration
- **Component Testing** - UI component testing for critical user flows

### Remaining Test Work

1. Write integration tests for React hooks (useGamification, etc.)
2. Perform UI component testing for gamification components  
3. Conduct end-to-end testing of the gamification flow

## Development

### Project Structure
```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── services/           # API services and data access
├── hooks/              # Custom React hooks
├── contexts/           # React context providers
├── utils/              # Utility functions
└── types/              # TypeScript type definitions
```

### Key Features Implementation

#### Monthly Plan Management
- Create monthly training plans with weekly workout assignments
- Assign plans to multiple athletes with conflict detection
- Track completion status and progress analytics
- Flexible week management (training weeks, rest weeks, workout replacement)

#### AI Chatbot Assistant
The chatbot uses OpenAI's GPT models through Supabase Edge Functions to provide:
- Training schedule information
- Performance metric analysis
- Sleep and recovery guidance
- Personalized training recommendations

For detailed setup instructions, see [Chatbot Setup Guide](./docs/chatbot-setup.md).

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please open an issue in the GitHub repository.
