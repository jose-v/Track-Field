import { supabase } from '../lib/supabase'
import type { Athlete, Coach, TeamManager, Profile, Team } from './dbSchema'

export interface Exercise {
  name: string
  sets: number
  reps: number
  weight?: number
  rest?: number
  distance?: number
  notes?: string
}

export interface Workout {
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

    async getByCreator(userId: string): Promise<Workout[]> {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
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

    async getAssignedToAthlete(athleteId: string) {
      try {
        console.log('Getting assigned workouts for athlete:', athleteId);
        
        // Get all workout_ids assigned to this athlete
        const { data: assignments, error: assignError } = await supabase
          .from('athlete_workouts')
          .select('workout_id')
          .eq('athlete_id', athleteId);
          
        if (assignError) {
          console.error('Error fetching athlete workout assignments:', assignError);
          throw assignError;
        }
        
        if (!assignments || assignments.length === 0) {
          console.log('No workouts assigned to athlete:', athleteId);
          return [];
        }
        
        const workoutIds = assignments.map(a => a.workout_id);
        console.log('Found', workoutIds.length, 'workout assignments for athlete');
        
        if (workoutIds.length === 0) return [];
        
        // Add a small delay to ensure database consistency (sometimes needed for Supabase)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Alternative query approach - query one by one if the IN clause is failing
        let workouts = [];
        
        // Try the IN clause first
        try {
          const { data, error } = await supabase
            .from('workouts')
            .select('*')
            .in('id', workoutIds);
            
          if (error) {
            console.error('Error with IN query, falling back to individual queries:', error);
          } else if (data && data.length > 0) {
            console.log('Successfully retrieved', data.length, 'workouts with IN query');
            workouts = data;
          }
        } catch (inError) {
          console.error('Exception with IN query:', inError);
        }
        
        // If the IN query failed or returned no results, try individual queries
        if (workouts.length === 0) {
          console.log('Falling back to individual workout queries');
          for (const workoutId of workoutIds) {
            try {
              const { data, error } = await supabase
                .from('workouts')
                .select('*')
                .eq('id', workoutId)
                .single();
                
              if (error) {
                console.error(`Error fetching workout ${workoutId}:`, error);
              } else if (data) {
                workouts.push(data);
              }
            } catch (err) {
              console.error(`Exception fetching workout ${workoutId}:`, err);
            }
          }
        }
        
        // Ensure exercises is always an array (even if null/undefined in database)
        const workoutsWithExercises = workouts.map(workout => ({
          ...workout,
          exercises: workout.exercises || []
        }));
        
        console.log('Returning', workoutsWithExercises.length, 'workouts to athlete');
        return workoutsWithExercises;
      } catch (error) {
        console.error('Error in getAssignedToAthlete:', error);
        throw error;
      }
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
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.error('No user found in auth.getUser()')
          throw new Error('No user found')
        }

        console.log('Fetching profile for user:', user.id)

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          throw error
        }
        
        if (!data) {
          console.error('No profile data found for user:', user.id)
          throw new Error('Profile not found')
        }

        console.log('Found profile:', data)
        
        let roleData = null
        if (data) {
          switch (data.role) {
            case 'athlete': {
              console.log('Fetching athlete data for:', user.id)
              const { data: athleteData, error: athleteError } = await supabase
                .from('athletes')
                .select('*')
                .eq('id', user.id)
                .single()
              
              if (athleteError) {
                console.error('Error fetching athlete data:', athleteError)
              } else {
                console.log('Found athlete data:', athleteData)
                roleData = athleteData
              }
              break
            }
            case 'coach': {
              const { data: coachData, error: coachError } = await supabase
                .from('coaches')
                .select('*')
                .eq('id', user.id)
                .single()
              
              if (!coachError) roleData = coachData
              break
            }
            case 'team_manager': {
              const { data: managerData, error: managerError } = await supabase
                .from('team_managers')
                .select('*')
                .eq('id', user.id)
                .single()
              
              if (!managerError) roleData = managerData
              break
            }
          }
        }

        return { ...data, roleData }
      } catch (error) {
        console.error('Error in profile.get():', error)
        throw error
      }
    },

    async update(profile: Partial<Profile>) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const profileData = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        bio: profile.bio
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async updateWithRoleData(profile: Partial<Profile>, roleData: any) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      await this.update(profile)

      const userRole = profile.role || (await this.get()).role
      
      if (userRole === 'athlete' && roleData) {
        const { error } = await supabase
          .from('athletes')
          .update({
            birth_date: roleData.birth_date,
            gender: roleData.gender,
            events: roleData.events,
            team_id: roleData.team_id
          })
          .eq('id', user.id)
        
        if (error) throw error
      }
      else if (userRole === 'coach' && roleData) {
        const { error } = await supabase
          .from('coaches')
          .update({
            specialties: roleData.specialties,
            certifications: roleData.certifications
          })
          .eq('id', user.id)
        
        if (error) throw error
      }
      else if (userRole === 'team_manager' && roleData) {
        const { error } = await supabase
          .from('team_managers')
          .update({
            organization: roleData.organization
          })
          .eq('id', user.id)
        
        if (error) throw error
      }

      return this.get()
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
    }
  },

  athletes: {
    async getAll() {
      const { data, error } = await supabase
        .from('athletes_view')
        .select('*')
      
      if (error) throw error
      return data
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('athletes_view')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },

    async getByTeam(teamId: string) {
      const { data, error } = await supabase
        .from('athletes_view')
        .select('*')
        .eq('team_id', teamId)
      
      if (error) throw error
      return data
    },

    async getByCoach(coachId: string) {
      const athleteIds = await this.getAthleteIdsByCoach(coachId);
      const { data, error } = await supabase
        .from('athletes_view')
        .select('*')
        .in('id', athleteIds);
      if (error) throw error;
      return data;
    },

    async search(query: string) {
      const { data, error } = await supabase
        .from('athletes_view')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,full_name.ilike.%${query}%`)
        .order('full_name')
      
      if (error) throw error
      return data
    },

    async update(id: string, athleteData: Partial<Athlete>) {
      const { data, error } = await supabase
        .from('athletes')
        .update(athleteData)
        .eq('id', id)
        .select()
      
      if (error) throw error
      return data
    },

    async create(profileData: Partial<Profile>, athleteData: Partial<Athlete>) {
      const profileId = crypto.randomUUID()
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: profileId,
          ...profileData,
          role: 'athlete',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
      
      if (profileError) throw profileError
      
      const { data, error: athleteError } = await supabase
        .from('athletes')
        .insert([{
          id: profileId,
          ...athleteData
        }])
        .select()
      
      if (athleteError) throw athleteError
      
      return data
    },

    async getAthleteIdsByCoach(coachId: string) {
      const { data, error } = await supabase
        .from('coach_athletes')
        .select('athlete_id')
        .eq('coach_id', coachId)
      
      if (error) throw error
      return data.map(row => row.athlete_id)
    }
  },

  coaches: {
    async getAll() {
      const { data, error } = await supabase
        .from('coaches_view')
        .select('*')
      
      if (error) throw error
      return data
    },
    
    async getById(id: string) {
      const { data, error } = await supabase
        .from('coaches_view')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    
    async getWithAthletes(coachId: string) {
      const { data, error } = await supabase
        .from('coach_athletes_view')
        .select('*')
        .eq('coach_id', coachId)
        .single()
      
      if (error) throw error
      return data
    },
    
    async assignAthlete(coachId: string, athleteId: string) {
      const { data, error } = await supabase
        .from('coach_athletes')
        .insert([{
          coach_id: coachId,
          athlete_id: athleteId,
          created_at: new Date().toISOString()
        }])
        .select()
      
      if (error) throw error
      return data
    },
    
    async removeAthlete(coachId: string, athleteId: string) {
      const { data, error } = await supabase
        .from('coach_athletes')
        .delete()
        .eq('coach_id', coachId)
        .eq('athlete_id', athleteId)
        .select()
      
      if (error) throw error
      return data
    }
  },

  teams: {
    async getAll() {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
      
      if (error) throw error
      return data
    },
    
    async getById(id: string) {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    
    async getWithAthletes(teamId: string) {
      const { data, error } = await supabase
        .from('team_athletes_view')
        .select('*')
        .eq('team_id', teamId)
        .single()
      
      if (error) throw error
      return data
    },
    
    async create(team: Partial<Team>) {
      const { data, error } = await supabase
        .from('teams')
        .insert([{
          ...team,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
      
      if (error) throw error
      return data
    },
    
    async update(id: string, team: Partial<Team>) {
      const { data, error } = await supabase
        .from('teams')
        .update({
          ...team,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
      
      if (error) throw error
      return data
    },
    
    async delete(id: string) {
      const { data, error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id)
        .select()
      
      if (error) throw error
      return data
    }
  },

  events: {
    async getAll() {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data
    },
    
    async getByCategory(category: string) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('category', category)
        .order('name')
      
      if (error) throw error
      return data
    }
  },

  records: {
    async getByAthlete(athleteId: string) {
      const { data, error } = await supabase
        .from('athlete_records_view')
        .select('*')
        .eq('id', athleteId)
        .order('event_name, record_date')
      
      if (error) throw error
      return data
    },
    
    async create(recordData: any) {
      const { data, error } = await supabase
        .from('personal_records')
        .insert([recordData])
        .select()
      
      if (error) throw error
      return data
    },
    
    async update(id: string, recordData: any) {
      const { data, error } = await supabase
        .from('personal_records')
        .update(recordData)
        .eq('id', id)
        .select()
      
      if (error) throw error
      return data
    },
    
    async delete(id: string) {
      const { data, error } = await supabase
        .from('personal_records')
        .delete()
        .eq('id', id)
        .select()
      
      if (error) throw error
      return data
    }
  },

  athleteWorkouts: {
    async assign(workoutId: string, athleteIds: string[]) {
      if (!workoutId || !athleteIds.length) return [];
      try {
        console.log(`Starting assignment of workout ${workoutId} to ${athleteIds.length} athletes`);
        
        // First, get existing assignments for this workout to avoid duplicates
        const { data: existingAssignments, error: fetchError } = await supabase
          .from('athlete_workouts')
          .select('athlete_id')
          .eq('workout_id', workoutId);
          
        if (fetchError) {
          console.error('Error fetching existing assignments:', fetchError);
          throw fetchError;
        }
        
        // Filter out athletes that are already assigned
        const existingAthleteIds = existingAssignments?.map(a => a.athlete_id) || [];
        const newAthleteIds = athleteIds.filter(id => !existingAthleteIds.includes(id));
        
        console.log(`Assigning workout ${workoutId} to ${newAthleteIds.length} new athletes`);
        
        if (newAthleteIds.length === 0) {
          console.log('No new athletes to assign');
          return existingAssignments || [];
        }
        
        // Create new assignments
        const rows = newAthleteIds.map(athlete_id => ({ 
          athlete_id, 
          workout_id: workoutId,
          status: 'assigned',
          assigned_at: new Date().toISOString()
        }));
        
        const { data, error } = await supabase
          .from('athlete_workouts')
          .insert(rows)
          .select();
          
        if (error) {
          console.error('Error creating assignments:', error);
          throw error;
        }
        
        // Add a slight delay to ensure database consistency
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log(`Successfully assigned workout ${workoutId} to athletes:`, 
                    newAthleteIds.join(', '));
        
        // Return all assignments (both existing and new)
        return [...(existingAssignments || []), ...(data || [])];
      } catch (error) {
        console.error('Error in assign method:', error);
        throw error;
      }
    },

    async updateAssignmentStatus(athleteId: string, workoutId: string, status: string) {
      const { data, error } = await supabase
        .from('athlete_workouts')
        .update({ status: status }) // Removed updated_at field since it doesn't exist
        .match({ athlete_id: athleteId, workout_id: workoutId })
        .select(); // Optionally select to confirm update and get results

      if (error) {
        console.error('Error updating assignment status:', error);
        throw error;
      }
      return data;
    },

    async getWorkoutCompletionStats(workoutId: string) {
      // Get all athlete assignments for this workout
      const { data: assignments, error: assignmentError } = await supabase
        .from('athlete_workouts')
        .select('athlete_id, status')
        .eq('workout_id', workoutId);
      
      if (assignmentError) {
        console.error('Error fetching workout assignment stats:', assignmentError);
        throw assignmentError;
      }
      
      // Count total and completed assignments
      const totalAssigned = assignments?.length || 0;
      const completedCount = assignments?.filter(a => a.status === 'completed')?.length || 0;
      
      return {
        workoutId,
        totalAssigned,
        completedCount,
        percentage: totalAssigned > 0 ? (completedCount / totalAssigned) * 100 : 0
      };
    },

    async getCompletionStatsForMultipleWorkouts(workoutIds: string[]) {
      if (!workoutIds.length) return [];
      
      // Get all athlete assignments for these workouts
      const { data: assignments, error: assignmentError } = await supabase
        .from('athlete_workouts')
        .select('workout_id, status')
        .in('workout_id', workoutIds);
      
      if (assignmentError) {
        console.error('Error fetching multiple workout stats:', assignmentError);
        throw assignmentError;
      }
      
      // Process data to count by workout_id
      const stats = workoutIds.map(workoutId => {
        const workoutAssignments = assignments?.filter(a => a.workout_id === workoutId) || [];
        const totalAssigned = workoutAssignments.length;
        const completedCount = workoutAssignments.filter(a => a.status === 'completed').length;
        
        return {
          workoutId,
          totalAssigned,
          completedCount,
          percentage: totalAssigned > 0 ? (completedCount / totalAssigned) * 100 : 0
        };
      });
      
      return stats;
    }
  }
} 