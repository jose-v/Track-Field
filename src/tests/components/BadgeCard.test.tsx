import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BadgeCard } from '../../features/gamification/BadgeCard';
import type { AthleteBadge, Badge } from '../../types/gamification';

describe('BadgeCard', () => {
  // Mock badge data
  const mockBadge: Badge = {
    id: 'badge-1',
    code: 'first_workout',
    name: 'First Workout',
    description: 'Completed your first workout',
    icon_url: '/badges/first_workout.svg',
    category: 'workout',
  };
  
  const mockAthleteBadge: AthleteBadge = {
    athlete_id: 'athlete-1',
    badge_id: 'badge-1',
    awarded_at: '2023-01-15T10:30:00Z',
    badge: mockBadge,
  };
  
  it('renders badge information correctly', () => {
    render(<BadgeCard badge={mockAthleteBadge} />);
    
    // Check badge name
    expect(screen.getByTestId('badge-name')).toHaveTextContent('First Workout');
    
    // Check badge description
    expect(screen.getByTestId('badge-description')).toHaveTextContent('Completed your first workout');
    
    // Check badge icon
    const badgeIcon = screen.getByTestId('badge-icon');
    expect(badgeIcon).toHaveAttribute('src', '/badges/first_workout.svg');
    expect(badgeIcon).toHaveAttribute('alt', 'First Workout');
    
    // Check formatted date
    expect(screen.getByTestId('badge-date')).toHaveTextContent(
      new Date('2023-01-15T10:30:00Z').toLocaleDateString()
    );
  });
  
  it('renders placeholder when icon_url is null', () => {
    const badgeWithoutIcon = {
      ...mockAthleteBadge,
      badge: {
        ...mockBadge,
        icon_url: null
      }
    };
    
    render(<BadgeCard badge={badgeWithoutIcon} />);
    
    // Check placeholder is rendered instead of badge icon
    expect(screen.getByTestId('badge-placeholder')).toHaveTextContent('F');
  });
  
  it('handles click events', () => {
    const handleClick = vi.fn();
    
    render(<BadgeCard badge={mockAthleteBadge} onClick={handleClick} />);
    
    // Click the badge card
    fireEvent.click(screen.getByTestId('badge-card'));
    
    // Check if click handler was called with badge data
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(mockAthleteBadge);
  });
  
  it('handles missing badge data gracefully', () => {
    const incompleteBadge: AthleteBadge = {
      athlete_id: 'athlete-1',
      badge_id: 'unknown-badge',
      awarded_at: '2023-01-15T10:30:00Z',
      // badge property is undefined
    };
    
    render(<BadgeCard badge={incompleteBadge} />);
    
    // Check fallback text is used
    expect(screen.getByTestId('badge-name')).toHaveTextContent('Unknown Badge');
    
    // Ensure no description is shown
    expect(screen.queryByTestId('badge-description')).toBeNull();
    
    // Check placeholder is used
    expect(screen.getByTestId('badge-placeholder')).toHaveTextContent('?');
  });
});
