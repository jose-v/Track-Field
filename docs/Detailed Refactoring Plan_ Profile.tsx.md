| table_name                | column_name            | data_type                | character_maximum_length | is_nullable | column_default     | ordinal_position |
| ------------------------- | ---------------------- | ------------------------ | ------------------------ | ----------- | ------------------ | ---------------- |
| training_plan_assignments | id                     | uuid                     | null                     | NO          | uuid_generate_v4() | 1                |
| training_plan_assignments | training_plan_id       | uuid                     | null                     | YES         | null               | 2                |
| training_plan_assignments | athlete_id             | uuid                     | null                     | YES         | null               | 3                |
| training_plan_assignments | assigned_by            | uuid                     | null                     | YES         | null               | 4                |
| training_plan_assignments | assigned_at            | timestamp with time zone | null                     | YES         | now()              | 5                |
| training_plan_assignments | status                 | text                     | null                     | YES         | 'assigned'::text   | 6                |
| training_plan_assignments | start_date             | date                     | null                     | NO          | null               | 7                |
| training_plan_assignments | completed_exercises    | jsonb                    | null                     | YES         | '[]'::jsonb        | 8                |
| training_plan_assignments | current_exercise_index | integer                  | null                     | YES         | 0                  | 9                |
| training_plan_assignments | current_set            | integer                  | null                     | YES         | 1                  | 10               |
| training_plan_assignments | current_rep            | integer                  | null                     | YES         | 1                  | 11               |
| workouts                  | id                     | uuid                     | null                     | NO          | uuid_generate_v4() | 1                |
| workouts                  | user_id                | uuid                     | null                     | NO          | null               | 2                |
| workouts                  | name                   | text                     | null                     | NO          | null               | 3                |
| workouts                  | type                   | text                     | null                     | YES         | null               | 4                |
| workouts                  | date                   | date                     | null                     | YES         | null               | 5                |
| workouts                  | duration               | text                     | null                     | YES         | null               | 6                |
| workouts                  | notes                  | text                     | null                     | YES         | null               | 7                |
| workouts                  | created_at             | timestamp with time zone | null                     | YES         | now()              | 8                |
| workouts                  | exercises              | jsonb                    | null                     | YES         | '[]'::jsonb        | 9                |
| workouts                  | time                   | text                     | null                     | YES         | null               | 10               |
| workouts                  | created_by             | uuid                     | null                     | YES         | null               | 11               |
| workouts                  | description            | text                     | null                     | YES         | null               | 12               |
| workouts                  | location               | text                     | null                     | YES         | null               | 13               |
| workouts                  | template_type          | text                     | null                     | YES         | 'single'::text     | 14               |
| workouts                  | is_template            | boolean                  | null                     | YES         | false              | 15               |
| workouts                  | template_category      | text                     | null                     | YES         | null               | 16               |
| workouts                  | is_draft               | boolean                  | null                     | YES         | false              | 17               |
| workouts                  | deleted_at             | timestamp with time zone | null                     | YES         | null               | 18               |
| workouts                  | deleted_by             | uuid                     | null                     | YES         | null               | 19               |
| workouts                  | flow_type              | text                     | null                     | YES         | 'sequential'::text | 20               |
| workouts                  | circuit_rounds         | integer                  | null                     | YES         | 3                  | 21               |
| workouts                  | blocks                 | jsonb                    | null                     | YES         | null               | 22               |
| workouts                  | is_block_based         | boolean                  | null                     | YES         | false              | 23               |
| workouts                  | block_version          | integer                  | null                     | YES         | 1                  | 24               |