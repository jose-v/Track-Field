import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import { format, parseISO, isValid } from 'date-fns';

type TimeFormat = '12' | '24';

interface TimeFormatContextType {
  timeFormat: TimeFormat;
  formatTime: (timeString: string | Date) => string;
  formatDateTime: (dateTimeString: string | Date) => string;
  setTimeFormat: (format: TimeFormat) => void;
}

const TimeFormatContext = createContext<TimeFormatContextType | undefined>(undefined);

export function TimeFormatProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('12');

  // Update time format when settings change
  useEffect(() => {
    if (settings?.settings?.timeFormat) {
      setTimeFormat(settings.settings.timeFormat);
    }
  }, [settings]);

  /**
   * Format time string to display format based on user preference
   * @param timeString - Time in HH:MM or HH:MM:SS format, or Date object
   * @returns Formatted time string
   */
  const formatTime = (timeString: string | Date): string => {
    try {
      let date: Date;

      if (typeof timeString === 'string') {
        // Handle time string in HH:MM or HH:MM:SS format
        if (timeString.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
          const timeParts = timeString.split(':');
          const hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);
          
          if (Number.isNaN(hours) || Number.isNaN(minutes)) {
            return 'Invalid Time';
          }
          
          // Create date object with today's date and provided time
          date = new Date();
          date.setHours(hours, minutes, 0, 0);
        } else {
          // Try to parse as ISO date string
          date = parseISO(timeString);
        }
      } else {
        date = timeString;
      }

      if (!isValid(date)) {
        return 'Invalid Time';
      }

      // Format based on user preference
      if (timeFormat === '24') {
        return format(date, 'HH:mm');
      } else {
        return format(date, 'h:mm a');
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Time Error';
    }
  };

  /**
   * Format date and time string to display format
   * @param dateTimeString - ISO date string or Date object
   * @returns Formatted date and time string
   */
  const formatDateTime = (dateTimeString: string | Date): string => {
    try {
      const date = typeof dateTimeString === 'string' ? parseISO(dateTimeString) : dateTimeString;
      
      if (!isValid(date)) {
        return 'Invalid Date';
      }

      // Format date part
      const datePart = format(date, 'MMM d, yyyy');
      
      // Format time part based on preference
      const timePart = timeFormat === '24' ? format(date, 'HH:mm') : format(date, 'h:mm a');
      
      return `${datePart} ${timePart}`;
    } catch (error) {
      console.error('Error formatting date time:', error);
      return 'DateTime Error';
    }
  };

  const value: TimeFormatContextType = {
    timeFormat,
    formatTime,
    formatDateTime,
    setTimeFormat,
  };

  return (
    <TimeFormatContext.Provider value={value}>
      {children}
    </TimeFormatContext.Provider>
  );
}

export function useTimeFormat() {
  const context = useContext(TimeFormatContext);
  if (context === undefined) {
    throw new Error('useTimeFormat must be used within a TimeFormatProvider');
  }
  return context;
} 