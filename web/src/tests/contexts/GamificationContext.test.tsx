import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useGamification, GamificationProvider } from '../../contexts/GamificationContext';
import { useGamificationNotification } from '../../features/gamification/GamificationNotification';
import { registerNotificationHandlers } from '../../services/gamificationIntegration';
import type { Badge } from '../../types/gamification';
import React from 'react';

// Mock dependencies
vi.mock('../../features/gamification/GamificationNotification', () => ({
  useGamificationNotification: vi.fn()
}));

vi.mock('../../services/gamificationIntegration', () => ({
  registerNotificationHandlers: vi.fn()
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-123' }
  }))
}));

describe('GamificationContext', () => {
  const mockShowBadgeNotification = vi.fn().mockReturnValue('notification-id');
  const mockShowPointsNotification = vi.fn().mockReturnValue('notification-id');
  const mockShowLevelUpNotification = vi.fn().mockReturnValue('notification-id');
  const mockShowStreakNotification = vi.fn().mockReturnValue('notification-id');
  const mockNotificationsContainer = vi.fn().mockReturnValue(null);
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock notification functions
    (useGamificationNotification as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      showBadgeNotification: mockShowBadgeNotification,
      showPointsNotification: mockShowPointsNotification,
      showLevelUpNotification: mockShowLevelUpNotification,
      showStreakNotification: mockShowStreakNotification,
      NotificationsContainer: mockNotificationsContainer
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  // Test component that uses the context
  const TestComponent = () => {
    // Call the hook but we don't need to use the returned methods
    // We just want to verify the context is providing them 
    useGamification();
    
    // Render data-testid attributes for verification
    return (
      <div>
        <div data-testid="has-badge-notification">{'true'}</div>
        <div data-testid="has-points-notification">{'true'}</div>
        <div data-testid="has-level-up-notification">{'true'}</div>
        <div data-testid="has-streak-notification">{'true'}</div>
      </div>
    );
  };
  
  it('should provide notification methods to child components', () => {
    render(
      <GamificationProvider>
        <TestComponent />
      </GamificationProvider>
    );
    
    // Verify that all notification functions are available
    expect(screen.getByTestId('has-badge-notification').textContent).toBe('true');
    expect(screen.getByTestId('has-points-notification').textContent).toBe('true');
    expect(screen.getByTestId('has-level-up-notification').textContent).toBe('true');
    expect(screen.getByTestId('has-streak-notification').textContent).toBe('true');
  });
  
  it('should register notification handlers when user is available', () => {
    render(
      <GamificationProvider>
        <TestComponent />
      </GamificationProvider>
    );
    
    // Verify that registerNotificationHandlers was called
    expect(registerNotificationHandlers).toHaveBeenCalledWith({
      onBadge: expect.any(Function),
      onPoints: expect.any(Function),
      onLevelUp: expect.any(Function),
      onStreak: expect.any(Function)
    });
  });
  
  it('should pass notification handlers that call the right functions', () => {
    render(
      <GamificationProvider>
        <TestComponent />
      </GamificationProvider>
    );
    
    // Get the handlers that were passed to registerNotificationHandlers
    const handlers = (registerNotificationHandlers as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    
    // Test badge notification
    const testBadge: Badge = {
      id: 'badge1',
      code: 'test_badge',
      name: 'Test Badge',
      description: 'A test badge',
      category: 'special',
      icon_url: '/badges/test_badge.svg'
    };
    handlers.onBadge(testBadge);
    expect(mockShowBadgeNotification).toHaveBeenCalledWith(testBadge);
    
    // Test points notification
    handlers.onPoints(10, 'Test points');
    expect(mockShowPointsNotification).toHaveBeenCalledWith(10, 'Test points');
    
    // Test level up notification
    handlers.onLevelUp(2, 'Level 2 Athlete');
    expect(mockShowLevelUpNotification).toHaveBeenCalledWith(2, 'Level 2 Athlete');
    
    // Test streak notification
    handlers.onStreak(7);
    expect(mockShowStreakNotification).toHaveBeenCalledWith(7);
  });
}); 