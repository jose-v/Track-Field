export const WORKOUT_TYPES = [
  'Running',
  'Sprinting',
  'Jumping',
  'Throwing',
  'Strength',
  'Flexibility',
  'Recovery',
  'Cross Training',
] as const

export const USER_ROLES = {
  ATHLETE: 'athlete',
  COACH: 'coach',
  TEAM_MANAGER: 'team_manager',
} as const

export const MEAL_TYPES = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Pre-Workout',
  'Post-Workout',
] as const

export const INTENSITY_LEVELS = [
  'Low',
  'Moderate',
  'High',
  'Very High',
  'Maximum',
] as const

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LAST_WORKOUT: 'last_workout',
} as const

export const API_ENDPOINTS = {
  AUTH: '/auth',
  WORKOUTS: '/workouts',
  TEAM: '/team',
  PROFILE: '/profile',
  MEALS: '/meals',
} as const

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  WORKOUTS: '/workouts',
  TEAM: '/team',
  PROFILE: '/profile',
} as const

export const QUERY_KEYS = {
  WORKOUTS: 'workouts',
  TEAM_POSTS: 'team-posts',
  PROFILE: 'profile',
  USER: 'user',
} as const

export const TOAST_DURATION = 3000
export const ERROR_TOAST_DURATION = 5000

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
] as const

export const DATE_FORMATS = {
  DISPLAY: 'MMM d, yyyy',
  TIME: 'h:mm a',
  DATETIME: 'MMM d, yyyy h:mm a',
  INPUT: 'yyyy-MM-dd',
} as const 