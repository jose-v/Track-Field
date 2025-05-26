# Track & Field Gamification Testing

This directory contains tests for the Track & Field app's gamification system. This README provides practical instructions for running and writing tests.

## Running Tests

### Run All Tests
```bash
cd /Volumes/MASTERIII/Track\ \&\ Field
npm test
```

### Run Working Component Tests Only
```bash
# Run all working component tests (that don't use hooks)
npx vitest run web/src/tests/components/BadgeCard.test.tsx web/src/tests/components/StreakIndicator.test.tsx web/src/tests/components/SimpleComponent.test.tsx

# Run service tests
npx vitest run web/src/tests/services/gamificationService.test.ts

# Run in watch mode
npm run test:watch
```

## Test Structure

1. **Service Tests**: Tests for the gamification service functions
   - `web/src/tests/services/gamificationService.test.ts`

2. **Component Tests**: Tests for UI components
   - `web/src/tests/components/SimpleComponent.test.tsx` - Basic component rendering test
   - `web/src/tests/components/BadgeCard.test.tsx` - Tests for badge display component
   - `web/src/tests/components/StreakIndicator.test.tsx` - Tests for streak visualization

3. **Context Tests**: Tests for React contexts
   - `web/src/tests/contexts/GamificationContext.test.tsx` (currently has React 19 compatibility issues)

4. **Hook Tests**: Tests for custom React hooks
   - `web/src/tests/hooks/useGamification.test.tsx` (currently has React 19 compatibility issues)

## Important Note on React 19 Compatibility

**Currently, there are compatibility issues between React 19 and testing libraries when testing components that use hooks.**

See the [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed information on these issues and recommended workarounds.

## Working Components

The following components have been specially designed to be hook-free for testing purposes:

1. **BadgeCard**: A simple component that displays badge information
   - Tests verify rendering of badge name, description, icon/placeholder, and click handling

2. **StreakIndicator**: A visual indicator for streak status
   - Tests verify different streak lengths change the appearance
   - Tests verify different sizes can be applied

## Writing New Tests

### Testing Simple Components
For components that don't use hooks, follow this pattern:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { YourComponent } from '../../path/to/YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent prop="value" />);
    
    // Use jest-dom matchers to assert rendered output
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Testing Service Functions

For service functions, follow this pattern:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { yourServiceFunction } from '../../services/yourService';

// Mock dependencies
vi.mock('../../dependencies/dependency', () => ({
  dependencyFunction: vi.fn(),
}));

describe('yourServiceFunction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should do what it is supposed to do', async () => {
    // Arrange
    const mockInput = { /* test data */ };
    
    // Act
    const result = await yourServiceFunction(mockInput);
    
    // Assert
    expect(result).toEqual(/* expected output */);
  });
});
```

## Troubleshooting

1. **Hook Testing Issues**: If you encounter errors testing components with hooks, consider:
   - Testing the component's rendered output without testing hook behavior
   - Extracting hook logic into plain functions and testing those separately
   - Using end-to-end testing for critical user flows

2. **Environment Issues**: If environment variables are needed, add them to your test file:
   ```ts
   vi.mock('../../config/environment', () => ({
     SOME_ENV_VAR: 'test-value'
   }));
   ```

## Useful Resources

- [Vitest Documentation](https://vitest.dev/guide/)
- [Testing Library Documentation](https://testing-library.com/docs/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom#custom-matchers)
- [React 19 Testing Guide](./TESTING_GUIDE.md) 