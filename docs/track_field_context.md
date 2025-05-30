# Track & Field Project Context & Guidelines

**READ THIS FILE FIRST in any new chat, session, or after a disconnection.**

---

## 1. Project Overview & Mission

The Track & Field web app is a modern, scalable platform for coaches and athletes to manage training, workouts, performance, and communication. The mission is to provide a robust, user-friendly, and data-driven tool for athletic development, supporting both day-to-day coaching and long-term athlete progress.

---

## 2. High-Level Architecture

- **Frontend:**
  - React (TypeScript), Chakra UI, React Router, react-dnd for drag-and-drop, custom hooks for data fetching.
  - Responsive, accessible, and mobile-friendly design.
- **Backend:**
  - Supabase (Postgres, Auth, Storage, Edge Functions).
  - Direct client calls for most CRUD, with Edge Functions for transactional or sensitive operations.
- **Database:**
  - Normalized Postgres schema (see `database_schema.html` and `data_base_updates.html`).
  - RLS (Row Level Security) enforced for all user data.
- **Integrations:**
  - AI chatbot (context-aware), potential for wearable/device data in future.

---

## 3. Key Workflows & Modules

- **Exercise Library:**
  - Centralized, normalized table for all exercises (`exercise_library`).
  - Used for building workouts, templates, and logging.
- **Workout Templates:**
  - Coaches create templates in `workouts`, composed of ordered exercises via `workout_template_exercises`.
  - Templates can be assigned to athletes via `workout_assignments`.
- **Athlete Logging:**
  - Athletes log performance in `athlete_exercise_logs`.
  - Supports feedback, comments, and coach review.
- **Training Plans:**
  - Multi-day plans using `training_plans`, `training_plan_days`, `training_plan_day_activities`, and `training_plan_assignments`.
- **Fitness Testing:**
  - Tests and results tracked in `tests` and `test_results`.
- **Gamification, Calendar, and Communication:**
  - See feature docs for details.

---

## 4. Database & Naming Conventions

- **Normalization:**
  - No redundant data; use foreign keys and linking tables.
  - All arrays are typed as `text[]` unless otherwise required.
- **Naming:**
  - Use `snake_case` for all table and column names.
  - Use `id` as primary key, `created_at`, `updated_at`, `created_by`, `updated_by` for audit.
  - Reference live schema for exact names (see `database_schema.html`).
- **RLS:**
  - All tables must have Row Level Security policies matching user roles and ownership.

---

## 5. UI/UX & Accessibility Principles

- **Clarity:**
  - Simple, intuitive workflows for coaches and athletes.
- **Drag-and-Drop:**
  - Used for exercise ordering, must be accessible (keyboard, ARIA).
- **Feedback:**
  - All actions provide clear success/error feedback.
- **Accessibility:**
  - Follow WCAG AA standards, test with screen readers, ensure color contrast.
- **Mobile:**
  - All pages must be responsive and usable on mobile devices.

---

## 6. Best Practices

- **Code:**
  - TypeScript everywhere, strict types, modular components.
  - Use custom hooks for data logic.
  - Error handling: always show user-friendly messages, log errors for devs.
- **Documentation:**
  - All major features and workflows documented in `/docs` (see `index.html`).
  - Update checklists and guides as features evolve.
- **Collaboration:**
  - Use checklists for progress tracking.
  - Keep a changelog for major updates.
  - Communicate schema or workflow changes clearly.

---

## 7. How to Use This File & What To Do Next

- **If you are an AI assistant or developer:**
  1. **Read this file in full before answering questions or making changes.**
  2. Reference the latest schema and docs in `/docs` (especially `data_base_updates.html`, `database_schema.html`, and UI/UX plans).
  3. When in doubt, ask for clarification or check the docs for the most recent updates.
  4. Always align code, migrations, and UI/UX with the principles and workflows described here.
  5. If starting a new feature or migration, update this file and the relevant docs.

- **If you are resuming after a disconnect or new chat:**
  - Summarize the current state and next steps based on this file and the latest docs.
  - Ensure continuity by referencing checklists and progress trackers in the docs.

---

**This file is the single source of truth for project context.**

For more details, see the `/docs/index.html` and linked resources. 