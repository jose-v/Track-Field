# Track & Field

A comprehensive track and field management application built with React, TypeScript, and Supabase.

<!-- CodeRabbit seat assignment trigger -->

## Features

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

## Testing the Gamification System

The gamification system has been thoroughly tested with unit tests covering the core functionality. To run tests:

```bash
npm test
```

This will run all unit tests for the gamification service. The tests cover:

1. Points system - awarding, accumulating, and retrieving points
2. Badge management - awarding badges and retrieving athlete badges 
3. Streak tracking - creating, updating, and resetting activity streaks
4. Leaderboard functionality - global and team-based leaderboards

The tests use a mock Supabase implementation to simulate database interactions without requiring an actual database connection.

### Remaining Test Work

According to the project milestones, the following testing tasks remain:

1. Write integration tests for React hooks (useGamification, etc.)
2. Perform UI component testing for gamification components
3. Conduct end-to-end testing of the gamification flow

### AI Chatbot Assistant

The application includes an AI-powered chatbot assistant that helps users get personalized information about:
- Training schedules and upcoming meets
- Performance metrics and improvements
- Sleep and recovery data

The chatbot uses OpenAI's GPT models through a secure Supabase Edge Function. During local development, the chatbot uses mock responses to avoid API costs.

For setup instructions, see [Chatbot Setup Guide](./docs/chatbot-setup.md).
