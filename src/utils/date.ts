import { format, formatDistanceToNow } from 'date-fns'

export const dateUtils = {
  format(date: string | Date, pattern = 'MMM d, yyyy'): string {
    return format(new Date(date), pattern)
  },

  formatTime(date: string | Date): string {
    return format(new Date(date), 'h:mm a')
  },

  formatDateTime(date: string | Date): string {
    return format(new Date(date), 'MMM d, yyyy h:mm a')
  },

  formatRelative(date: string | Date): string {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  },

  isSameDay(date1: string | Date, date2: string | Date): boolean {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    )
  },
} 