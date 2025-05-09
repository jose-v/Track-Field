import { supabase } from '../lib/supabase'

interface Exercise {
  name: string
  sets: number
  reps: number
  weight?: number
  rest?: number
  distance?: number
  notes?: string
}

interface Workout {
  id: string
  user_id: string
  name: string
  type: string
  date: string
  duration: string
  time?: string
  notes: string
  created_at: string
  exercises: Exercise[]
}

interface TeamPost {
  id: string
  user_id: string
  content: string
  created_at: string
}

export const api = {
  workouts: {
    async getAll(): Promise<Workout[]> {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },

    async create(workout: Omit<Workout, 'id' | 'user_id' | 'created_at'>): Promise<Workout> {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')
      const { data, error } = await supabase
        .from('workouts')
        .insert([{ ...workout, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      return data
    },

    async update(id: string, workout: Partial<Workout>): Promise<Workout> {
      const { data, error } = await supabase
        .from('workouts')
        .update(workout)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
  },

  team: {
    async getPosts(): Promise<TeamPost[]> {
      const { data, error } = await supabase
        .from('team_posts')
        .select('*, user:users(name, avatar_url)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },

    async createPost(content: string): Promise<TeamPost> {
      const { data, error } = await supabase
        .from('team_posts')
        .insert([{ content }])
        .select()
        .single()

      if (error) throw error
      return data
    },

    async deletePost(id: string): Promise<void> {
      const { error } = await supabase
        .from('team_posts')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
  },

  profile: {
    async get() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data
    },

    async update(profile: any) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { data, error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async upsert(profile: any) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')
      const { data, error } = await supabase
        .from('profiles')
        .upsert([{ ...profile, id: user.id }], { onConflict: 'id' })
        .select()
        .single()
      if (error) throw error
      return data
    },
  },
} 