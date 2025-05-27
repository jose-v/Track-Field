Okay, this is an excellent goal, and making these database changes will significantly enhance your app's capabilities, especially for coaches creating detailed plans.

Let's break this down into a phased plan. It's crucial to do this step-by-step, especially when modifying an existing schema. **Always back up your database before making significant schema changes, especially in a production environment. If possible, test these changes in a staging/development environment first.**

**Overall Strategy:**

1. **Establish a Central Exercise Library:** Define all possible exercises.  
2. **Redefine Workout Structure:** Make workouts act as templates composed of exercises from the library.  
3. **Implement Detailed Athlete Performance Logging:** Allow athletes to record specifics for each exercise in an assigned workout.  
4. **Implement Training Plans:** Allow coaches to group workouts into weekly/monthly schedules.  
5. **Implement Fitness Testing Module.**  
6. **Data Migration:** Plan how to move any existing data.

---

**Phase 1: Exercise Library & Revised Workout Templates**

This phase creates the foundation for structured workouts.

**Step 1.1: Create exercise\_library Table**

This table will store all unique exercises.

     \-- exercise\_library Table  
CREATE TABLE public.exercise\_library (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    name TEXT NOT NULL UNIQUE,  
    description TEXT,  
    category TEXT CHECK (category IN ('warm\_up', 'drill', 'plyometric', 'lift', 'run\_interval', 'rest\_interval', 'cool\_down', 'flexibility', 'custom')), \-- Expand as needed  
    video\_url TEXT,  
    default\_instructions TEXT,  
    user\_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, \-- For user-created custom exercises  
    is\_system\_exercise BOOLEAN DEFAULT FALSE, \-- True for pre-defined, False for coach-added  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,  
    updated\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL  
);

\-- RLS for exercise\_library  
ALTER TABLE public.exercise\_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public exercise library are viewable by everyone"  
ON public.exercise\_library FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert exercises"  
ON public.exercise\_library FOR INSERT TO authenticated WITH CHECK (true); \-- Or more restrictive: (user\_id \= auth.uid())

CREATE POLICY "Users can update their own custom exercises or admins system exercises"  
ON public.exercise\_library FOR UPDATE USING (  
    (user\_id \= auth.uid() AND is\_system\_exercise \= FALSE)  
    \-- OR (SELECT role FROM public.profiles WHERE id \= auth.uid()) \= 'admin' \-- If you have an admin role  
) WITH CHECK (  
    (user\_id \= auth.uid() AND is\_system\_exercise \= FALSE)  
    \-- OR (SELECT role FROM public.profiles WHERE id \= auth.uid()) \= 'admin'  
);

CREATE POLICY "Users can delete their own custom exercises or admins system exercises"  
ON public.exercise\_library FOR DELETE USING (  
    (user\_id \= auth.uid() AND is\_system\_exercise \= FALSE)  
    \-- OR (SELECT role FROM public.profiles WHERE id \= auth.uid()) \= 'admin'  
);  
   

**Step 1.2: Create workout\_template\_exercises Table**

This table links exercises from the exercise\_library to a workouts entry (which will now function as a template), specifying the order and parameters.

     \-- workout\_template\_exercises Table  
CREATE TABLE public.workout\_template\_exercises (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    workout\_template\_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,  
    exercise\_library\_id UUID NOT NULL REFERENCES public.exercise\_library(id) ON DELETE CASCADE,  
    order\_in\_workout INTEGER NOT NULL, \-- To maintain sequence  
    prescribed\_sets TEXT, \-- e.g., "3", "2x"  
    prescribed\_reps TEXT, \-- e.g., "10", "8-12", "AMRAP"  
    prescribed\_duration TEXT, \-- e.g., "30s", "5-min" (for timed exercises/rests)  
    prescribed\_distance TEXT, \-- e.g., "150m", "5km"  
    prescribed\_weight TEXT, \-- e.g., "50kg", "Bodyweight", "RPE 8"  
    rest\_interval TEXT, \-- e.g., "60s", "Walk back"  
    notes TEXT, \-- Specific notes for this exercise in this workout  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,  
    UNIQUE (workout\_template\_id, order\_in\_workout)  
);

\-- RLS for workout\_template\_exercises (access often tied to workout\_template access)  
ALTER TABLE public.workout\_template\_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view exercises of workouts they can view"  
ON public.workout\_template\_exercises FOR SELECT USING (  
  EXISTS (  
    SELECT 1 FROM public.workouts w  
    WHERE w.id \= workout\_template\_id  
    \-- Apply similar logic as workout view RLS, e.g., owner or assigned  
    AND (  
        w.user\_id \= auth.uid() \-- Owner  
        \-- Or coach of assigned athlete  
        OR EXISTS (  
            SELECT 1 FROM public.workout\_assignments wa  
            JOIN public.coach\_athletes ca ON wa.athlete\_id \= ca.athlete\_id  
            WHERE wa.workout\_id \= w.id AND ca.coach\_id \= auth.uid() AND ca.approval\_status \= 'approved'  
        )  
        \-- Or assigned athlete  
        OR EXISTS (  
            SELECT 1 FROM public.workout\_assignments wa  
            WHERE wa.workout\_id \= w.id AND wa.athlete\_id \= auth.uid()  
        )  
    )  
  )  
);

CREATE POLICY "Users can manage exercises of their own workouts"  
ON public.workout\_template\_exercises FOR ALL USING (  
  EXISTS (  
    SELECT 1 FROM public.workouts w  
    WHERE w.id \= workout\_template\_id AND w.user\_id \= auth.uid()  
  )  
);  
     
IGNORE\_WHEN\_COPYING\_START  
content\_copy download  
Use code [with caution](https://support.google.com/legal/answer/13505487). SQL  
IGNORE\_WHEN\_COPYING\_END

**Step 1.3: Modify the existing workouts Table**

* The workouts.exercises JSONB column will eventually be removed.  
* We keep other fields like name, description, type, notes as these define the template.  
* The RLS policies for workouts might need slight adjustments if you have a specific "template creator" vs "assigner" logic you want to enforce more granularly, but your current ones are a good start for owner-based management.

**(Hold off on ALTER TABLE workouts DROP COLUMN exercises; until after data migration in a later phase).**

**UI Implications for Phase 1:**

* **Exercise Library Management UI:** Coaches (and maybe athletes for custom lists) need an interface to add/edit/view exercises in exercise\_library.  
* **Workout Creation UI (Coach):**  
  * When a coach creates a "workout" (template), they will search/select exercises from exercise\_library.  
  * For each selected exercise, they'll fill in the prescribed\_sets, reps, duration, etc., which populates workout\_template\_exercises.  
  * The drag-and-drop interface for ordering exercises would update order\_in\_workout.  
* 

---

**Phase 2: Athlete Performance Logging**

This allows athletes to record what they actually did.

**Step 2.1: Create athlete\_exercise\_logs Table**

     \-- athlete\_exercise\_logs Table  
CREATE TABLE public.athlete\_exercise\_logs (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    workout\_assignment\_id UUID NOT NULL REFERENCES public.workout\_assignments(id) ON DELETE CASCADE,  
    \-- This links to the specific exercise in the template that was prescribed:  
    workout\_template\_exercise\_id UUID REFERENCES public.workout\_template\_exercises(id) ON DELETE SET NULL,  
    \-- Alternatively, if logging an ad-hoc exercise not part of a template:  
    exercise\_library\_id UUID REFERENCES public.exercise\_library(id) ON DELETE SET NULL,  
    \-- Ensure one of the above two is populated if you allow ad-hoc logging  
    completed\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  
    actual\_sets TEXT,  
    actual\_reps TEXT,  
    actual\_duration TEXT,  
    actual\_distance TEXT,  
    actual\_weight TEXT,  
    athlete\_notes TEXT,  
    perceived\_exertion INTEGER CHECK (perceived\_exertion \>= 1 AND perceived\_exertion \<= 10), \-- RPE  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,  
    updated\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL  
);

\-- Index for faster querying  
CREATE INDEX idx\_athlete\_exercise\_logs\_assignment\_id ON public.athlete\_exercise\_logs(workout\_assignment\_id);  
CREATE INDEX idx\_athlete\_exercise\_logs\_template\_exercise\_id ON public.athlete\_exercise\_logs(workout\_template\_exercise\_id);

\-- RLS for athlete\_exercise\_logs  
ALTER TABLE public.athlete\_exercise\_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can manage their own exercise logs"  
ON public.athlete\_exercise\_logs FOR ALL  
USING (  
  EXISTS (  
    SELECT 1 FROM public.workout\_assignments wa  
    WHERE wa.id \= workout\_assignment\_id AND wa.athlete\_id \= auth.uid()  
  )  
) WITH CHECK (  
  EXISTS (  
    SELECT 1 FROM public.workout\_assignments wa  
    WHERE wa.id \= workout\_assignment\_id AND wa.athlete\_id \= auth.uid()  
  )  
);

CREATE POLICY "Assigned coaches can view their athletes' exercise logs"  
ON public.athlete\_exercise\_logs FOR SELECT  
USING (  
  EXISTS (  
    SELECT 1  
    FROM public.workout\_assignments wa  
    JOIN public.coach\_athletes ca ON wa.athlete\_id \= ca.athlete\_id  
    WHERE wa.id \= workout\_assignment\_id  
      AND ca.coach\_id \= auth.uid()  
      AND ca.approval\_status \= 'approved'  
  )  
);  
     
IGNORE\_WHEN\_COPYING\_START  
content\_copy download  
Use code [with caution](https://support.google.com/legal/answer/13505487). SQL  
IGNORE\_WHEN\_COPYING\_END

**UI Implications for Phase 2:**

* **Athlete Workout Execution UI:**  
  * When an athlete starts an assigned workout, they see the list of prescribed exercises (from workout\_template\_exercises via the workout\_assignments link).  
  * For each exercise, they can input their actual\_sets, reps, etc. This creates records in athlete\_exercise\_logs.  
  * Your "Exercise Execution" modal would save data to this table.  
* 

---

**Phase 3: Training Plans (Daily, Weekly, Monthly Schedules)**

This allows coaches to build structured programs.

**Step 3.1: Create training\_plans Table**

     \-- training\_plans Table  
CREATE TABLE public.training\_plans (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    coach\_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,  
    name TEXT NOT NULL,  
    description TEXT,  
    start\_date DATE,  
    end\_date DATE,  
    goal TEXT, \-- e.g., "Peaking for Regionals", "Off-season GPP"  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,  
    updated\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL  
);

\-- RLS for training\_plans  
ALTER TABLE public.training\_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage their own training plans"  
ON public.training\_plans FOR ALL  
USING (coach\_id \= auth.uid())  
WITH CHECK (coach\_id \= auth.uid());

CREATE POLICY "Athletes can view plans they are assigned to"  
ON public.training\_plans FOR SELECT  
USING (  
  EXISTS (  
    SELECT 1 FROM public.training\_plan\_assignments tpa  
    WHERE tpa.training\_plan\_id \= id AND tpa.athlete\_id \= auth.uid()  
  )  
);  
     
IGNORE\_WHEN\_COPYING\_START  
content\_copy download  
Use code [with caution](https://support.google.com/legal/answer/13505487). SQL  
IGNORE\_WHEN\_COPYING\_END

**Step 3.2: Create training\_plan\_days Table (or training\_plan\_entries)**

This table defines what happens on each day of a plan.

     \-- training\_plan\_days Table  
CREATE TABLE public.training\_plan\_days (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    training\_plan\_id UUID NOT NULL REFERENCES public.training\_plans(id) ON DELETE CASCADE,  
    plan\_date DATE NOT NULL, \-- Specific date for this entry in the plan  
    day\_notes TEXT, \-- e.g., "Focus on recovery", "High intensity"  
    \-- You could link workout templates directly here if a day usually has one main workout  
    \-- workout\_template\_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,  
    updated\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,  
    UNIQUE (training\_plan\_id, plan\_date)  
);

\-- RLS (similar to training\_plans, derived access)  
ALTER TABLE public.training\_plan\_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view days of plans they have access to"  
ON public.training\_plan\_days FOR SELECT  
USING (  
  EXISTS (  
    SELECT 1 FROM public.training\_plans tp  
    WHERE tp.id \= training\_plan\_id AND (  
        tp.coach\_id \= auth.uid() \-- Coach who owns the plan  
        OR EXISTS ( \-- Athlete assigned to the plan  
            SELECT 1 FROM public.training\_plan\_assignments tpa  
            WHERE tpa.training\_plan\_id \= tp.id AND tpa.athlete\_id \= auth.uid()  
        )  
    )  
  )  
);

CREATE POLICY "Coaches can manage days of their own training plans"  
ON public.training\_plan\_days FOR ALL  
USING (  
  EXISTS (  
    SELECT 1 FROM public.training\_plans tp  
    WHERE tp.id \= training\_plan\_id AND tp.coach\_id \= auth.uid()  
  )  
);  
     
IGNORE\_WHEN\_COPYING\_START  
content\_copy download  
Use code [with caution](https://support.google.com/legal/answer/13505487). SQL  
IGNORE\_WHEN\_COPYING\_END

**Step 3.3: Create training\_plan\_day\_activities Table**

A day in a plan might have multiple activities (e.g., Warm-up Workout, Main Workout, Cool-down Workout, or just a note like "Rest").

     \-- training\_plan\_day\_activities  
CREATE TABLE public.training\_plan\_day\_activities (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    training\_plan\_day\_id UUID NOT NULL REFERENCES public.training\_plan\_days(id) ON DELETE CASCADE,  
    workout\_template\_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL, \-- Link to a workout template  
    activity\_type TEXT CHECK (activity\_type IN ('workout', 'rest', 'recovery\_session', 'note')),  
    activity\_name TEXT, \-- e.g., "DHP A-Switch Warm-Up", or "Active Recovery Swim"  
    order\_in\_day INTEGER DEFAULT 1,  
    notes TEXT, \-- Specific instructions for this activity on this day  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,  
    updated\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL  
);

\-- RLS (similar to training\_plan\_days, derived access)  
ALTER TABLE public.training\_plan\_day\_activities ENABLE ROW LEVEL SECURITY;

\-- (Simplified RLS, assuming if you can see the training\_plan\_day, you can see its activities)  
CREATE POLICY "Users can view activities of plan days they have access to"  
ON public.training\_plan\_day\_activities FOR SELECT  
USING (  
  EXISTS (  
    SELECT 1  
    FROM public.training\_plan\_days tpd  
    JOIN public.training\_plans tp ON tpd.training\_plan\_id \= tp.id  
    WHERE tpd.id \= training\_plan\_day\_id AND (  
        tp.coach\_id \= auth.uid()  
        OR EXISTS (  
            SELECT 1 FROM public.training\_plan\_assignments tpa  
            WHERE tpa.training\_plan\_id \= tp.id AND tpa.athlete\_id \= auth.uid()  
        )  
    )  
  )  
);

CREATE POLICY "Coaches can manage activities of their own training plan days"  
ON public.training\_plan\_day\_activities FOR ALL  
USING (  
  EXISTS (  
    SELECT 1  
    FROM public.training\_plan\_days tpd  
    JOIN public.training\_plans tp ON tpd.training\_plan\_id \= tp.id  
    WHERE tpd.id \= training\_plan\_day\_id AND tp.coach\_id \= auth.uid()  
  )  
);  
     
IGNORE\_WHEN\_COPYING\_START  
content\_copy download  
Use code [with caution](https://support.google.com/legal/answer/13505487). SQL  
IGNORE\_WHEN\_COPYING\_END

**Step 3.4: Create training\_plan\_assignments Table**

To assign a whole plan to an athlete.

     \-- training\_plan\_assignments Table  
CREATE TABLE public.training\_plan\_assignments (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    training\_plan\_id UUID NOT NULL REFERENCES public.training\_plans(id) ON DELETE CASCADE,  
    athlete\_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,  
    assigned\_by UUID REFERENCES public.coaches(id) ON DELETE SET NULL,  
    assigned\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,  
    start\_date DATE, \-- Athlete might start a plan on a different date than plan's generic start  
    notes TEXT,  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,  
    updated\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,  
    UNIQUE (training\_plan\_id, athlete\_id)  
);

\-- RLS  
ALTER TABLE public.training\_plan\_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage assignments for their own plans"  
ON public.training\_plan\_assignments FOR ALL  
USING (  
  EXISTS (  
    SELECT 1 FROM public.training\_plans tp  
    WHERE tp.id \= training\_plan\_id AND tp.coach\_id \= auth.uid()  
  )  
);

CREATE POLICY "Athletes can view their own plan assignments"  
ON public.training\_plan\_assignments FOR SELECT  
USING (athlete\_id \= auth.uid());  
     
IGNORE\_WHEN\_COPYING\_START  
content\_copy download  
Use code [with caution](https://support.google.com/legal/answer/13505487). SQL  
IGNORE\_WHEN\_COPYING\_END

* When a coach assigns a training\_plan to an athlete, you might have a backend process that automatically creates individual workout\_assignments for each workout\_template\_id specified in the training\_plan\_day\_activities for the duration of the plan. This makes the athlete's daily view simpler.

**UI Implications for Phase 3:**

* **Coach UI for Training Plan Creation:**  
  * Calendar-like interface (weekly/monthly view).  
  * Coach defines training\_plans.  
  * For each day (training\_plan\_days), they can add activities (training\_plan\_day\_activities), which can be selecting workout templates or adding notes like "Rest".  
  * Assign plans to athletes.  
*   
* **Athlete UI:**  
  * Calendar shows workouts derived from their assigned training plan.  
* 

---

**Phase 4: Fitness Testing Module**

To store tests like "Vertical Jump," "30m Sprint."

**Step 4.1: Create tests Table**

     \-- tests Table  
CREATE TABLE public.tests (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    name TEXT NOT NULL UNIQUE,  
    description TEXT,  
    unit TEXT, \-- e.g., "cm", "seconds", "kg", "meters"  
    category TEXT, \-- e.g., "Speed", "Power", "Endurance"  
    created\_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, \-- If coaches can add tests  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,  
    updated\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL  
);

\-- RLS (similar to exercise\_library: public view, restricted create/update/delete)  
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;  
CREATE POLICY "Tests are viewable by everyone" ON public.tests FOR SELECT USING (true);  
CREATE POLICY "Authenticated users can create tests" ON public.tests FOR INSERT TO authenticated WITH CHECK (true);  
\-- Add more granular update/delete if needed  
     
IGNORE\_WHEN\_COPYING\_START  
content\_copy download  
Use code [with caution](https://support.google.com/legal/answer/13505487). SQL  
IGNORE\_WHEN\_COPYING\_END

**Step 4.2: Create test\_results Table**

     \-- test\_results Table  
CREATE TABLE public.test\_results (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    athlete\_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,  
    test\_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,  
    coach\_id UUID REFERENCES public.coaches(id) ON DELETE SET NULL, \-- Who recorded/administered  
    result\_value TEXT NOT NULL, \-- Using TEXT to be flexible (e.g., "10.5s", "75cm", "Level 3")  
                                \-- Consider NUMERIC if all results for a test are numbers  
    test\_date DATE NOT NULL,  
    location TEXT,  
    notes TEXT,  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,  
    updated\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,  
    UNIQUE(athlete\_id, test\_id, test\_date) \-- One result per athlete per test per day  
);

\-- RLS for test\_results  
ALTER TABLE public.test\_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can manage their own test results"  
ON public.test\_results FOR ALL  
USING (athlete\_id \= auth.uid())  
WITH CHECK (athlete\_id \= auth.uid());

CREATE POLICY "Assigned coaches can manage their athletes' test results"  
ON public.test\_results FOR ALL \-- Or SELECT and INSERT/UPDATE separately  
USING (  
  EXISTS (  
    SELECT 1 FROM public.coach\_athletes ca  
    WHERE ca.athlete\_id \= athlete\_id  
      AND ca.coach\_id \= auth.uid()  
      AND ca.approval\_status \= 'approved'  
  )  
);  
     
IGNORE\_WHEN\_COPYING\_START  
content\_copy download  
Use code [with caution](https://support.google.com/legal/answer/13505487). SQL  
IGNORE\_WHEN\_COPYING\_END

**UI Implications for Phase 4:**

* Coach UI to define tests.  
* Coach/Athlete UI to log test results.  
* Athlete UI to view their test history and progress.

---

**Phase 5: Data Migration & Cleanup**

**Step 5.1: Data Migration Script (Crucial & Complex)**

* You need to write a script (e.g., server-side JavaScript using Supabase client, or Python) to:  
  1. Iterate through your existing workouts table.  
  2. For each workout, parse the exercises JSONB array.  
  3. For each exercise object in the JSON:  
     * Try to find a matching exercise in exercise\_library by name. If not found, create a new entry in exercise\_library (mark user\_id as the workout's original user\_id and is\_system\_exercise \= false).  
     * Insert a new record into workout\_template\_exercises, linking the original workout.id (now workout\_template\_id), the found/created exercise\_library\_id, and populating prescribed\_sets, reps, etc., from the JSON object. Preserve the order.  
  4.   
*   
* **This is the most delicate part. Test thoroughly.**

**Step 5.2: Drop the old exercises column from workouts**

     \-- After successful data migration and verification:  
ALTER TABLE public.workouts  
DROP COLUMN exercises;  
     
IGNORE\_WHEN\_COPYING\_START  
content\_copy download  
Use code [with caution](https://support.google.com/legal/answer/13505487). SQL  
IGNORE\_WHEN\_COPYING\_END

**Step 5.3: Evaluate and potentially remove athlete\_workouts**

* Your workout\_assignments table seems more comprehensive for assigning a workout template and tracking its overall status for an athlete.  
* athlete\_exercise\_logs now handles the detailed performance of each exercise within that assigned workout.

If athlete\_workouts is redundant, you can drop it. If it serves another specific purpose not covered, re-evaluate.  
      \-- If athlete\_workouts is deemed redundant after review:  
\-- DROP TABLE public.athlete\_workouts;

*      
   IGNORE\_WHEN\_COPYING\_START  
   content\_copy download  
   Use code [with caution](https://support.google.com/legal/answer/13505487). SQL  
  IGNORE\_WHEN\_COPYING\_END

---

**Where to Start & How to Use in Supabase:**

1. **Backup Your Database:** Essential.  
2. **Use the SQL Editor in Supabase:** Navigate to "SQL Editor" in your Supabase project dashboard.  
3. **Execute SQL Commands:**  
   * Copy and paste the CREATE TABLE and ALTER TABLE ... ENABLE ROW LEVEL SECURITY statements for each new table in a given phase. Run them one by one or in batches. Start with Phase 1 tables, then Phase 2, etc. Dependencies matter (e.g., create exercise\_library before workout\_template\_exercises).  
   * Then, copy and paste the CREATE POLICY statements for each table.  
4.   
5. **Manual Table Creation (Alternative):** For some, using the Supabase UI to create tables and then adding RLS via the UI or SQL editor might feel more comfortable, but for this many changes, SQL is more efficient.  
6. **Data Migration Script:** This will likely be run outside the Supabase SQL editor, using a Supabase client library in your language of choice (e.g., supabase-js for Node.js/browser, supabase-py for Python).  
7. **Iterate on UI:**  
   * **Start with Coach UI for Exercise Library:** Coaches need to populate exercise\_library. You could pre-populate it with common exercises from the PDFs.  
   * **Adapt Coach UI for Workout Template Creation:** Change it to use the new exercise\_library and save to workout\_template\_exercises.  
   * **Implement Athlete Workout Execution & Logging:** This will involve fetching from workout\_template\_exercises (via workout\_assignments) and saving to athlete\_exercise\_logs.  
8. 

This is a significant undertaking, but it will make your database much more powerful and aligned with the complex needs of coaching. Take it one phase at a time\! Let me know if you want to dive deeper into any specific phase or SQL command.

