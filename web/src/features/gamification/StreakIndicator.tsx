import React from 'react';

interface StreakIndicatorProps {
  streakDays: number;
  size?: 'small' | 'medium' | 'large';
}

/**
 * StreakIndicator - A visual indicator for a streak
 * This is a simple component without hooks for easier testing
 */
export function StreakIndicator({ streakDays, size = 'medium' }: StreakIndicatorProps) {
  // Size mappings
  const sizeMap = {
    small: { width: '16px', height: '16px', fontSize: '8px' },
    medium: { width: '24px', height: '24px', fontSize: '12px' },
    large: { width: '32px', height: '32px', fontSize: '16px' }
  };
  
  // Colors based on streak length
  let flameColor = '#6c757d'; // Default gray
  
  if (streakDays >= 30) {
    flameColor = '#ff4500'; // Hot red-orange for 30+ days
  } else if (streakDays >= 14) {
    flameColor = '#ff8c00'; // Orange for 14+ days
  } else if (streakDays >= 7) {
    flameColor = '#ffd700'; // Gold for 7+ days
  } else if (streakDays >= 3) {
    flameColor = '#ffa07a'; // Light salmon for 3+ days
  }
  
  // Adjust text color based on streak
  const textColor = streakDays >= 7 ? '#000' : '#fff';
  
  return (
    <div 
      data-testid="streak-indicator"
      style={{
        ...styles.streakContainer,
        backgroundColor: flameColor,
        ...sizeMap[size]
      }}
    >
      <div 
        style={{
          ...styles.streakText,
          color: textColor,
          fontSize: sizeMap[size].fontSize
        }}
        data-testid="streak-count"
      >
        {streakDays}
      </div>
      {streakDays > 0 && (
        <div 
          style={styles.streakLabel}
          data-testid="streak-label"
        >
          {streakDays === 1 ? 'day' : 'days'}
        </div>
      )}
    </div>
  );
}

const styles = {
  streakContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    position: 'relative' as const,
  },
  streakText: {
    fontWeight: 'bold' as const,
  },
  streakLabel: {
    fontSize: '10px',
    color: '#fff',
    position: 'absolute' as const,
    bottom: '-20px',
    whiteSpace: 'nowrap' as const,
    textAlign: 'center' as const,
  }
}; 