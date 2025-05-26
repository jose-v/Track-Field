import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGamification } from '../../contexts/GamificationContext';
import { GamificationProvider } from '../../contexts/GamificationContext';
import { useGamificationNotification } from '../../features/gamification/GamificationNotification';
import { registerNotificationHandlers } from '../../services/gamificationIntegration';
import type { Badge } from '../../types/gamification';
import React from 'react';

// Define the notification handlers interface
interface NotificationHandlers {
  onBadge?: (badge: Badge) => void;
  onPoints?: (points: number, reason: string) => void;
  onLevelUp?: (level: number, title: string) => void;
  onStreak?: (days: number) => void;
}

// Store the mock handlers for testing
let mockHandlers: NotificationHandlers = {};

// Mock dependencies
vi.mock('../../features/gamification/GamificationNotification', () => ({
  useGamificationNotification: vi.fn()
}));

vi.mock('../../services/gamificationIntegration', () => ({
  registerNotificationHandlers: vi.fn((handlers: NotificationHandlers) => {
    mockHandlers = handlers;
    return true;
  })
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-123' }
  }))
}));

describe('useGamification', () => {
  const mockShowBadgeNotification = vi.fn();
  const mockShowPointsNotification = vi.fn();
  const mockShowLevelUpNotification = vi.fn();
  const mockShowStreakNotification = vi.fn();
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    mockHandlers = {};
    
    // Mock the notification functions
    (useGamificationNotification as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      showBadgeNotification: mockShowBadgeNotification,
      showPointsNotification: mockShowPointsNotification,
      showLevelUpNotification: mockShowLevelUpNotification,
      showStreakNotification: mockShowStreakNotification,
      NotificationsContainer: () => null,
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('should provide notification methods', () => {
    // Create a wrapper component with the GamificationProvider
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GamificationProvider>{children}</GamificationProvider>
    );
    
    const { result } = renderHook(() => useGamification(), { wrapper });
    
    expect(result.current.showBadgeNotification).toBeDefined();
    expect(result.current.showPointsNotification).toBeDefined();
    expect(result.current.showLevelUpNotification).toBeDefined();
    expect(result.current.showStreakNotification).toBeDefined();
  });
  
  it('should register notification handlers when user is available', () => {
    // Create a wrapper component with the GamificationProvider
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GamificationProvider>{children}</GamificationProvider>
    );
    
    renderHook(() => useGamification(), { wrapper });
    
    // Verify registerNotificationHandlers was called
    expect(registerNotificationHandlers).toHaveBeenCalled();
    
    // Verify handlers are defined
    expect(mockHandlers.onBadge).toBeDefined();
    expect(mockHandlers.onPoints).toBeDefined();
    expect(mockHandlers.onLevelUp).toBeDefined();
    expect(mockHandlers.onStreak).toBeDefined();
  });
  
  it('should call notification methods when handlers are triggered', () => {
    // Create a wrapper component with the GamificationProvider
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GamificationProvider>{children}</GamificationProvider>
    );
    
    renderHook(() => useGamification(), { wrapper });
    
    // Test badge notification
    const testBadge: Badge = {
      id: 'badge1',
      code: 'test_badge',
      name: 'Test Badge',
      description: 'A test badge',
      category: 'special',
      icon_url: '/badges/test_badge.svg'
    };
    
    if (mockHandlers.onBadge) {
      mockHandlers.onBadge(testBadge);
      expect(mockShowBadgeNotification).toHaveBeenCalledWith(testBadge);
    }
    
    // Test points notification
    if (mockHandlers.onPoints) {
      mockHandlers.onPoints(10, 'Test points');
      expect(mockShowPointsNotification).toHaveBeenCalledWith(10, 'Test points');
    }
    
    // Test level up notification
    if (mockHandlers.onLevelUp) {
      mockHandlers.onLevelUp(2, 'Level 2 Athlete');
      expect(mockShowLevelUpNotification).toHaveBeenCalledWith(2, 'Level 2 Athlete');
    }
    
    // Test streak notification
    if (mockHandlers.onStreak) {
      mockHandlers.onStreak(7);
      expect(mockShowStreakNotification).toHaveBeenCalledWith(7);
    }
  });
}); 