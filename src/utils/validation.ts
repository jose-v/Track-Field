export const validation = {
  email(value: string): string | undefined {
    if (!value) {
      return 'Email is required'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return 'Invalid email format'
    }
  },

  password(value: string): string | undefined {
    if (!value) {
      return 'Password is required'
    }

    if (value.length < 8) {
      return 'Password must be at least 8 characters'
    }

    if (!/[A-Z]/.test(value)) {
      return 'Password must contain at least one uppercase letter'
    }

    if (!/[a-z]/.test(value)) {
      return 'Password must contain at least one lowercase letter'
    }

    if (!/[0-9]/.test(value)) {
      return 'Password must contain at least one number'
    }
  },

  required(value: any, fieldName: string): string | undefined {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`
    }
  },

  minLength(value: string, min: number, fieldName: string): string | undefined {
    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters`
    }
  },

  maxLength(value: string, max: number, fieldName: string): string | undefined {
    if (value.length > max) {
      return `${fieldName} must be no more than ${max} characters`
    }
  },

  phone(value: string): string | undefined {
    if (!value) {
      return
    }

    const phoneRegex = /^\+?[\d\s-()]{10,}$/
    if (!phoneRegex.test(value)) {
      return 'Invalid phone number format'
    }
  },

  date(value: string): string | undefined {
    if (!value) {
      return 'Date is required'
    }

    const date = new Date(value)
    if (isNaN(date.getTime())) {
      return 'Invalid date format'
    }
  },

  time(value: string): string | undefined {
    if (!value) {
      return 'Time is required'
    }

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(value)) {
      return 'Invalid time format (HH:MM)'
    }
  },
} 