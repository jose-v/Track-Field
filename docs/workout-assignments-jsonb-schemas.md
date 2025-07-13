# Workout Assignments JSONB Schemas

This document defines the JSONB structures used in the `workout_assignments` table for `exercise_block`, `progress`, and `meta` fields.

## 📋 **Table Structure Overview**

```sql
workout_assignments
├── exercise_block JSONB  -- Workout content (exercises, sets, reps)
├── progress JSONB        -- Universal progress tracking
└── meta JSONB           -- Type-specific metadata
```

---

## 🏋️ **1. Exercise Block Schemas** 

### **Single Workout Assignment** (`assignment_type = 'single'`)

```json
{
  "workout_name": "Morning Strength Training",
  "workout_type": "strength",
  "flow_type": "sequential",
  "estimated_duration": "45 minutes",
  "exercises": [
    {
      "id": "ex_001",
      "name": "Push-ups",
      "type": "strength",
      "sets": 3,
      "reps": 15,
      "rest_seconds": 60,
      "instructions": "Keep core tight, full range of motion",
      "media_url": "/exercise-media/videos/strength/push-ups.mp4"
    },
    {
      "id": "ex_002", 
      "name": "Squats",
      "type": "strength",
      "sets": 4,
      "reps": 12,
      "rest_seconds": 90,
      "weight": "bodyweight",
      "instructions": "Feet shoulder-width apart, sit back into heels"
    }
  ]
}
```

### **Block-Based Workout** (`assignment_type = 'single'`, block structure)

```json
{
  "workout_name": "HIIT Circuit Training",
  "workout_type": "circuit", 
  "flow_type": "block",
  "estimated_duration": "30 minutes",
  "blocks": [
    {
      "id": "block_001",
      "name": "Upper Body Block",
      "type": "circuit",
      "rounds": 3,
      "rest_between_rounds": 120,
      "exercises": [
        {
          "id": "ex_001",
          "name": "Burpees",
          "duration_seconds": 30,
          "rest_seconds": 15
        },
        {
          "id": "ex_002", 
          "name": "Mountain Climbers",
          "duration_seconds": 30,
          "rest_seconds": 15
        }
      ]
    }
  ]
}
```

### **Weekly Plan Assignment** (`assignment_type = 'weekly'`)

```json
{
  "plan_name": "Competition Prep Week 3",
  "week_start_date": "2024-01-15",
  "week_end_date": "2024-01-21",
  "total_days": 7,
  "rest_days": [7], // Sunday
  "daily_workouts": {
    "monday": {
      "workout_name": "Speed Work",
      "exercises": [/* exercise array */]
    },
    "tuesday": {
      "workout_name": "Strength Training", 
      "exercises": [/* exercise array */]
    },
    "wednesday": {
      "workout_name": "Recovery Run",
      "exercises": [/* exercise array */]
    }
    // ... etc for each day
  }
}
```

### **Monthly Plan Assignment** (`assignment_type = 'monthly'`)

```json
{
  "plan_name": "January Training Block",
  "month": 1,
  "year": 2024,
  "total_days": 31,
  "total_weeks": 4,
  "rest_days": [7, 14, 21, 28],
  "weekly_structure": [
    {
      "week": 1,
      "focus": "base_building",
      "workout_ids": ["workout_001", "workout_002", "workout_003"]
    },
    {
      "week": 2, 
      "focus": "intensity",
      "workout_ids": ["workout_004", "workout_005", "workout_006"]
    }
    // ... etc for each week
  ]
}
```

---

## 📊 **2. Progress Schema (Universal)**

The `progress` field uses the same structure for all assignment types:

```json
{
  "current_exercise_index": 2,
  "current_set": 3,
  "current_rep": 8,
  "completed_exercises": [0, 1], // Exercise indices that are fully complete
  "started_at": "2024-01-15T10:30:00Z",
  "completed_at": null,
  "last_activity_at": "2024-01-15T10:45:00Z",
  "total_exercises": 5,
  "completion_percentage": 40,
  
  // Time tracking
  "total_time_seconds": 900, // 15 minutes so far
  "exercise_times": {
    "0": 300, // First exercise took 5 minutes
    "1": 420  // Second exercise took 7 minutes
  },
  
  // Set/rep tracking for current exercise
  "current_exercise_progress": {
    "completed_sets": [
      {"set": 1, "reps": 15, "completed_at": "2024-01-15T10:32:00Z"},
      {"set": 2, "reps": 15, "completed_at": "2024-01-15T10:35:00Z"}
    ],
    "current_set_reps_completed": 8
  }
}
```

---

## 🎯 **3. Meta Schema (Type-Specific)**

### **EMOM (Every Minute on the Minute)**
```json
{
  "workout_style": "emom",
  "total_minutes": 20,
  "exercise_per_minute": {
    "exercise_id": "ex_001", 
    "reps": 10
  },
  "current_minute": 15,
  "minutes_completed": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
}
```

### **AMRAP (As Many Rounds As Possible)**
```json
{
  "workout_style": "amrap",
  "time_cap_minutes": 15,
  "rounds_completed": 4,
  "current_round_progress": {
    "exercise_index": 2,
    "reps_completed": 8
  },
  "round_times": [
    {"round": 1, "time_seconds": 180},
    {"round": 2, "time_seconds": 195},
    {"round": 3, "time_seconds": 210},
    {"round": 4, "time_seconds": 185}
  ]
}
```

### **Circuit Training**
```json
{
  "workout_style": "circuit",
  "total_stations": 6,
  "work_seconds": 45,
  "rest_seconds": 15,
  "rounds": 4,
  "current_round": 3,
  "current_station": 4,
  "station_completion": [
    {"round": 1, "stations_completed": 6},
    {"round": 2, "stations_completed": 6},
    {"round": 3, "stations_completed": 3}
  ]
}
```

### **Monthly Plan Specific**
```json
{
  "current_week": 3,
  "current_day": 15,
  "weeks_completed": [1, 2],
  "weekly_progress": {
    "week_1": {"workouts_completed": 5, "total_workouts": 5},
    "week_2": {"workouts_completed": 4, "total_workouts": 5},
    "week_3": {"workouts_completed": 2, "total_workouts": 5}
  },
  "focus_areas": ["speed", "endurance", "recovery"]
}
```

---

## 🔄 **Migration Mapping**

### From `training_plan_assignments` → `workout_assignments`

```json
// OLD training_plan_assignments format
{
  "completed_exercises": [0, 1, 2],
  "current_exercise_index": 3,
  "current_set": 2,
  "current_rep": 5
}

// NEW workout_assignments.progress format  
{
  "completed_exercises": [0, 1, 2],
  "current_exercise_index": 3,
  "current_set": 2,
  "current_rep": 5,
  "started_at": "2024-01-15T10:30:00Z",
  "total_exercises": 8,
  "completion_percentage": 37.5
}
```

### From `workouts.exercises` → `workout_assignments.exercise_block`

```json
// OLD workouts table format
{
  "exercises": [/* exercise array */],
  "flow_type": "sequential",
  "is_block_based": false
}

// NEW workout_assignments.exercise_block format
{
  "workout_name": "From workouts.name",
  "flow_type": "sequential", 
  "exercises": [/* same exercise array */]
}
```

---

## ✅ **Validation Rules**

1. **exercise_block**: Must contain valid workout structure
2. **progress**: Must have numeric values for indices/counts
3. **meta**: Can be empty `{}` for basic workouts
4. **assignment_type**: Must match exercise_block structure
   - `single`: Contains `exercises` or `blocks` array
   - `weekly`: Contains `daily_workouts` object  
   - `monthly`: Contains `weekly_structure` array 