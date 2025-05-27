/**
 * Badge Detail Modal Component
 * Shows detailed information about a badge when clicked
 */

import React from 'react';
import type { AthleteBadge } from '../../types/gamification';

interface BadgeDetailModalProps {
  badge: AthleteBadge | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BadgeDetailModal({ badge, isOpen, onClose }: BadgeDetailModalProps) {
  if (!isOpen || !badge) return null;

  // Format date for display
  const awardedDate = badge.awarded_at 
    ? new Date(badge.awarded_at).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'Unknown';

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div style={styles.closeButton} onClick={onClose}>×</div>
        
        <div style={styles.badgeHeader}>
          {badge.badge?.icon_url ? (
            <img 
              src={badge.badge.icon_url} 
              alt={badge.badge?.name || 'Badge'} 
              style={styles.badgeIcon}
            />
          ) : (
            <div style={styles.badgePlaceholder}>
              {badge.badge?.name?.charAt(0) || '?'}
            </div>
          )}
          
          <h2 style={styles.badgeTitle}>{badge.badge?.name || 'Badge'}</h2>
        </div>
        
        <div style={styles.badgeInfo}>
          <p style={styles.badgeDescription}>
            {badge.badge?.description || 'No description available.'}
          </p>
          
          <div style={styles.badgeDetails}>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Category:</span>
              <span style={styles.detailValue}>
                {badge.badge?.category 
                  ? badge.badge.category.charAt(0).toUpperCase() + badge.badge.category.slice(1)
                  : 'Unknown'}
              </span>
            </div>
            
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Awarded:</span>
              <span style={styles.detailValue}>{awardedDate}</span>
            </div>
          </div>
        </div>
        
        <button style={styles.closeModalButton} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

const styles = {
  modalBackdrop: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    position: 'relative' as const,
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  closeButton: {
    position: 'absolute' as const,
    top: '10px',
    right: '15px',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
  },
  badgeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '20px',
  },
  badgeIcon: {
    width: '80px',
    height: '80px',
  },
  badgePlaceholder: {
    width: '80px',
    height: '80px',
    backgroundColor: '#6c757d',
    color: 'white',
    display: 'flex',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    fontSize: '32px',
    fontWeight: 'bold' as const,
    borderRadius: '50%',
  },
  badgeTitle: {
    margin: 0,
    fontSize: '24px',
    color: '#333',
  },
  badgeInfo: {
    marginBottom: '20px',
  },
  badgeDescription: {
    fontSize: '16px',
    color: '#555',
    marginBottom: '20px',
    lineHeight: 1.5,
  },
  badgeDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  detailItem: {
    display: 'flex',
    gap: '10px',
  },
  detailLabel: {
    fontWeight: 'bold' as const,
    minWidth: '100px',
    color: '#666',
  },
  detailValue: {
    color: '#333',
  },
  closeModalButton: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
}; 