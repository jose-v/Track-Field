import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StreakIndicator } from '../../features/gamification/StreakIndicator';

describe('StreakIndicator', () => {
  it('displays correct streak count', () => {
    render(<StreakIndicator streakDays={7} />);
    
    expect(screen.getByTestId('streak-count')).toHaveTextContent('7');
    expect(screen.getByTestId('streak-label')).toHaveTextContent('days');
  });
  
  it('uses singular form for 1 day streak', () => {
    render(<StreakIndicator streakDays={1} />);
    
    expect(screen.getByTestId('streak-count')).toHaveTextContent('1');
    expect(screen.getByTestId('streak-label')).toHaveTextContent('day');
  });
  
  it('applies correct styles for different streak lengths', () => {
    // Test zero streak
    const { rerender } = render(<StreakIndicator streakDays={0} />);
    let indicator = screen.getByTestId('streak-indicator');
    expect(indicator.style.backgroundColor).toBe('rgb(108, 117, 125)'); // Default gray
    
    // No streak label for zero
    expect(screen.queryByTestId('streak-label')).toBeNull();
    
    // Test short streak (3-6 days)
    rerender(<StreakIndicator streakDays={5} />);
    indicator = screen.getByTestId('streak-indicator');
    expect(indicator.style.backgroundColor).toBe('rgb(255, 160, 122)'); // Light salmon
    
    // Test medium streak (7-13 days)
    rerender(<StreakIndicator streakDays={10} />);
    indicator = screen.getByTestId('streak-indicator');
    expect(indicator.style.backgroundColor).toBe('rgb(255, 215, 0)'); // Gold
    
    // Test long streak (14-29 days)
    rerender(<StreakIndicator streakDays={20} />);
    indicator = screen.getByTestId('streak-indicator');
    expect(indicator.style.backgroundColor).toBe('rgb(255, 140, 0)'); // Orange
    
    // Test very long streak (30+ days)
    rerender(<StreakIndicator streakDays={35} />);
    indicator = screen.getByTestId('streak-indicator');
    expect(indicator.style.backgroundColor).toBe('rgb(255, 69, 0)'); // Hot red-orange
  });
  
  it('applies different sizes based on size prop', () => {
    // Test small size
    const { rerender } = render(<StreakIndicator streakDays={5} size="small" />);
    let indicator = screen.getByTestId('streak-indicator');
    expect(indicator.style.width).toBe('16px');
    expect(indicator.style.height).toBe('16px');
    
    // Test medium size (default)
    rerender(<StreakIndicator streakDays={5} size="medium" />);
    indicator = screen.getByTestId('streak-indicator');
    expect(indicator.style.width).toBe('24px');
    expect(indicator.style.height).toBe('24px');
    
    // Test large size
    rerender(<StreakIndicator streakDays={5} size="large" />);
    indicator = screen.getByTestId('streak-indicator');
    expect(indicator.style.width).toBe('32px');
    expect(indicator.style.height).toBe('32px');
  });
}); 