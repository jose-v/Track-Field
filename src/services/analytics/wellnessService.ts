// Wellness Service
// Handles daily wellness surveys and wellness data management

import { supabase } from '../../lib/supabase';
import { WellnessMetrics } from '../../utils/analytics/types';

/**
 * Save daily wellness survey
 */
export async function saveWellnessSurvey(
  athleteId: string,
  metrics: Omit<WellnessMetrics, 'date'>,
  date?: string
): Promise<void> {
  const surveyDate = date || new Date().toISOString().split('T')[0];

  const { error } = await supabase
    .from('athlete_wellness_surveys')
    .upsert({
      athlete_id: athleteId,
      survey_date: surveyDate,
      fatigue_level: metrics.fatigue,
      muscle_soreness: metrics.soreness,
      stress_level: metrics.stress,
      motivation_level: metrics.motivation,
      overall_feeling: metrics.overallFeeling,
      sleep_quality: metrics.sleepQuality,
      sleep_duration: metrics.sleepDuration,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'athlete_id,survey_date'
    });

  if (error) {
    console.error('Error saving wellness survey:', error);
    throw new Error('Failed to save wellness survey');
  }
}

/**
 * Fetch wellness surveys for an athlete
 */
export async function fetchWellnessSurveys(
  athleteId: string,
  days: number = 30
): Promise<WellnessMetrics[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('athlete_wellness_surveys')
    .select('*')
    .eq('athlete_id', athleteId)
    .gte('survey_date', startDate.toISOString().split('T')[0])
    .order('survey_date', { ascending: false });

  if (error) {
    console.error('Error fetching wellness surveys:', error);
    throw new Error('Failed to fetch wellness data');
  }

  return (data || []).map(record => ({
    date: record.survey_date,
    fatigue: record.fatigue_level,
    soreness: record.muscle_soreness,
    stress: record.stress_level,
    motivation: record.motivation_level,
    overallFeeling: record.overall_feeling,
    sleepQuality: record.sleep_quality,
    sleepDuration: record.sleep_duration
  }));
}

/**
 * Get today's wellness survey for an athlete
 */
export async function getTodaysWellnessSurvey(athleteId: string): Promise<WellnessMetrics | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('athlete_wellness_surveys')
    .select('*')
    .eq('athlete_id', athleteId)
    .eq('survey_date', today)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No data found - this is expected if survey not completed today
      return null;
    }
    console.error('Error fetching today\'s wellness survey:', error);
    throw new Error('Failed to fetch today\'s wellness data');
  }

  if (!data) return null;

  return {
    date: data.survey_date,
    fatigue: data.fatigue_level,
    soreness: data.muscle_soreness,
    stress: data.stress_level,
    motivation: data.motivation_level,
    overallFeeling: data.overall_feeling,
    sleepQuality: data.sleep_quality,
    sleepDuration: data.sleep_duration
  };
}

/**
 * Check if athlete has completed wellness survey today
 */
export async function hasCompletedTodaysSurvey(athleteId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('athlete_wellness_surveys')
    .select('survey_date')
    .eq('athlete_id', athleteId)
    .eq('survey_date', today)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking wellness survey completion:', error);
    return false;
  }

  return !!data;
}

/**
 * Get wellness completion rate for an athlete over a period
 */
export async function getWellnessCompletionRate(
  athleteId: string,
  days: number = 30
): Promise<{
  completionRate: number;
  completedDays: number;
  totalDays: number;
  missedDates: string[];
}> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('athlete_wellness_surveys')
    .select('survey_date')
    .eq('athlete_id', athleteId)
    .gte('survey_date', startDate.toISOString().split('T')[0])
    .lte('survey_date', endDate.toISOString().split('T')[0])
    .order('survey_date', { ascending: true });

  if (error) {
    console.error('Error fetching wellness completion data:', error);
    throw new Error('Failed to fetch wellness completion data');
  }

  const completedDates = new Set((data || []).map(record => record.survey_date));
  const missedDates: string[] = [];
  
  // Generate all dates in the range
  const currentDate = new Date(startDate);
  let totalDays = 0;
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    totalDays++;
    
    if (!completedDates.has(dateStr)) {
      missedDates.push(dateStr);
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const completedDays = completedDates.size;
  const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  return {
    completionRate: Number(completionRate.toFixed(1)),
    completedDays,
    totalDays,
    missedDates
  };
}

/**
 * Fetch wellness data for multiple athletes (coach view)
 */
export async function fetchTeamWellnessOverview(athleteIds: string[]): Promise<{
  athleteId: string;
  todaysWellness?: WellnessMetrics;
  completionRate: number;
  lastSurveyDate?: string;
}[]> {
  if (athleteIds.length === 0) return [];

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Fetch today's wellness data for all athletes
  const { data: todaysData, error: todaysError } = await supabase
    .from('athlete_wellness_surveys')
    .select('*')
    .in('athlete_id', athleteIds)
    .eq('survey_date', today);

  // Fetch recent wellness data for completion rates
  const { data: recentData, error: recentError } = await supabase
    .from('athlete_wellness_surveys')
    .select('athlete_id, survey_date')
    .in('athlete_id', athleteIds)
    .gte('survey_date', weekAgo.toISOString().split('T')[0])
    .order('survey_date', { ascending: false });

  if (todaysError || recentError) {
    console.error('Error fetching team wellness overview:', { todaysError, recentError });
    throw new Error('Failed to fetch team wellness overview');
  }

  // Process data for each athlete
  const result = athleteIds.map(athleteId => {
    // Today's wellness
    const todaysRecord = todaysData?.find(record => record.athlete_id === athleteId);
    const todaysWellness = todaysRecord ? {
      date: todaysRecord.survey_date,
      fatigue: todaysRecord.fatigue_level,
      soreness: todaysRecord.muscle_soreness,
      stress: todaysRecord.stress_level,
      motivation: todaysRecord.motivation_level,
      overallFeeling: todaysRecord.overall_feeling,
      sleepQuality: todaysRecord.sleep_quality,
      sleepDuration: todaysRecord.sleep_duration
    } : undefined;

    // Completion rate (last 7 days)
    const athleteRecentData = recentData?.filter(record => record.athlete_id === athleteId) || [];
    const completionRate = (athleteRecentData.length / 7) * 100;
    
    // Last survey date
    const lastSurveyDate = athleteRecentData.length > 0 ? athleteRecentData[0].survey_date : undefined;

    return {
      athleteId,
      todaysWellness,
      completionRate: Number(completionRate.toFixed(1)),
      lastSurveyDate
    };
  });

  return result;
}

/**
 * Delete wellness survey (for corrections)
 */
export async function deleteWellnessSurvey(athleteId: string, date: string): Promise<void> {
  const { error } = await supabase
    .from('athlete_wellness_surveys')
    .delete()
    .eq('athlete_id', athleteId)
    .eq('survey_date', date);

  if (error) {
    console.error('Error deleting wellness survey:', error);
    throw new Error('Failed to delete wellness survey');
  }
}

/**
 * Get wellness survey reminders for athletes who haven't completed today's survey
 */
export async function getWellnessReminders(athleteIds: string[]): Promise<string[]> {
  if (athleteIds.length === 0) return [];

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('athlete_wellness_surveys')
    .select('athlete_id')
    .in('athlete_id', athleteIds)
    .eq('survey_date', today);

  if (error) {
    console.error('Error fetching wellness reminders:', error);
    return [];
  }

  const completedAthletes = new Set((data || []).map(record => record.athlete_id));
  return athleteIds.filter(athleteId => !completedAthletes.has(athleteId));
} 