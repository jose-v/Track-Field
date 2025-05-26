/**
 * Badge Definitions
 * Contains the predefined badges that can be awarded to athletes
 */

export const BADGE_DEFINITIONS = [
  // Workout badges
  {
    code: "first_workout",
    name: "First Workout",
    description: "Completed your first workout",
    category: "workout",
    icon_url: "/badges/first_workout.svg"
  },
  {
    code: "workout_warrior",
    name: "Workout Warrior",
    description: "Completed 10 workouts",
    category: "workout",
    icon_url: "/badges/workout_warrior.svg"
  },
  {
    code: "exercise_expert",
    name: "Exercise Expert",
    description: "Completed 50 workouts",
    category: "workout",
    icon_url: "/badges/exercise_expert.svg"
  },
  
  // Nutrition badges
  {
    code: "nutrition_novice",
    name: "Nutrition Novice",
    description: "Logged your first nutrition entry",
    category: "nutrition",
    icon_url: "/badges/nutrition_novice.svg"
  },
  {
    code: "balanced_diet",
    name: "Balanced Diet",
    description: "Logged 10 nutrition entries",
    category: "nutrition",
    icon_url: "/badges/balanced_diet.svg"
  },
  {
    code: "nutrition_master",
    name: "Nutrition Master",
    description: "Logged 50 nutrition entries",
    category: "nutrition",
    icon_url: "/badges/nutrition_master.svg"
  },
  
  // Sleep badges
  {
    code: "sleep_tracker",
    name: "Sleep Tracker",
    description: "Recorded your first sleep log",
    category: "sleep",
    icon_url: "/badges/sleep_tracker.svg"
  },
  {
    code: "well_rested",
    name: "Well Rested",
    description: "Recorded 10 sleep logs",
    category: "sleep",
    icon_url: "/badges/well_rested.svg"
  },
  {
    code: "sleep_champion",
    name: "Sleep Champion",
    description: "Recorded 30 consecutive days of sleep",
    category: "sleep",
    icon_url: "/badges/sleep_champion.svg"
  },
  
  // Streak badges
  {
    code: "getting_started",
    name: "Getting Started",
    description: "3-day activity streak",
    category: "streak",
    icon_url: "/badges/getting_started.svg"
  },
  {
    code: "consistency",
    name: "Consistency",
    description: "7-day activity streak",
    category: "streak",
    icon_url: "/badges/consistency.svg"
  },
  {
    code: "dedication",
    name: "Dedication",
    description: "14-day activity streak",
    category: "streak",
    icon_url: "/badges/dedication.svg"
  },
  {
    code: "unstoppable",
    name: "Unstoppable",
    description: "30-day activity streak",
    category: "streak",
    icon_url: "/badges/unstoppable.svg"
  },
  
  // Points milestone badges
  {
    code: "bronze_athlete",
    name: "Bronze Athlete",
    description: "Earned 100 points",
    category: "points",
    icon_url: "/badges/bronze_athlete.svg"
  },
  {
    code: "silver_athlete",
    name: "Silver Athlete",
    description: "Earned 250 points",
    category: "points",
    icon_url: "/badges/silver_athlete.svg"
  },
  {
    code: "gold_athlete",
    name: "Gold Athlete",
    description: "Earned 500 points",
    category: "points",
    icon_url: "/badges/gold_athlete.svg"
  },
  {
    code: "platinum_athlete",
    name: "Platinum Athlete",
    description: "Earned 1000 points",
    category: "points",
    icon_url: "/badges/platinum_athlete.svg"
  }
]; 