import { Routes, Route, Outlet } from 'react-router-dom';
import Home from '../pages/Home';
import HomeAlt from '../pages/HomeAlt';
import { Login } from '../pages/Login';
import { Signup } from '../pages/Signup';
import { Pricing } from '../pages/Pricing';
import { Features } from '../pages/Features';
import { About } from '../pages/About';
import { Events } from '../pages/Events';
import { Contact } from '../pages/Contact';
import { Layout as GeneralLayout } from '../components/Layout';
import { PrivateRoute } from '../components/PrivateRoute';
import { NotFound } from '../pages/NotFound';
import RoleDashboardRouter from '../pages/RoleDashboardRouter';
import Loop from '../pages/Loop';
import LoopRouteWrapper from '../pages/LoopRouteWrapper';

// Coach pages
import { CoachDashboard } from '../pages/coach/Dashboard';
import { CoachWorkouts } from '../pages/coach/Workouts';
import { CoachEvents } from '../pages/coach/Events';
import { CoachStats } from '../pages/coach/Stats';
import { CoachAthletes } from '../pages/coach/Athletes';
import { CreateWorkout } from '../pages/coach/CreateWorkout';
import { ImportWorkout } from '../pages/coach/ImportWorkout';
import { EditWorkout } from '../pages/coach/EditWorkout';
import { Calendar as CoachCalendar } from '../pages/coach/Calendar';

// Athlete pages
import { Dashboard as AthleteDashboard } from '../pages/Dashboard';
import { Workouts } from '../pages/Workouts';
import { Team } from '../pages/Team';
import { Profile } from '../pages/Profile';
import { AthleteEvents } from '../pages/athlete/Events';
import { AthleteWorkouts } from '../pages/athlete/AthleteWorkouts';
import { Nutrition } from '../pages/athlete/Nutrition';
import { Sleep } from '../pages/athlete/Sleep';
import { Calendar as AthleteCalendar } from '../pages/athlete/Calendar';

// Features
import { GamificationTestPage } from '../features/gamification';

// Layouts & wrappers
import PublicLayout from '../layouts/PublicLayout';
import AthleteLayoutWithFeedback from '../layouts/AthleteLayoutWithFeedback';
import CoachLayoutWithFeedback from '../layouts/CoachLayoutWithFeedback';

// Notifications
import NotificationsPage from '../pages/NotificationsPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>    
        <Route index element={<Home />} />
        <Route path="home-alt" element={<HomeAlt />} />
        <Route path="features" element={<Features />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="events" element={<Events />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
      </Route>

      {/* Original Protected Routes (general/unspecified roles) */}
      <Route element={<GeneralLayout><Outlet /></GeneralLayout>}>
        <Route path="/dashboard" element={<PrivateRoute><RoleDashboardRouter /></PrivateRoute>} />
        <Route path="/workouts" element={<PrivateRoute><Workouts /></PrivateRoute>} />
        <Route path="/team" element={<PrivateRoute><Team /></PrivateRoute>} />
        <Route path="/private-events" element={<PrivateRoute><Events /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      </Route>

      {/* Coach Routes - With Feedback */}
      <Route element={<CoachLayoutWithFeedback />}> 
        <Route path="/coach/dashboard" element={<PrivateRoute><CoachDashboard /></PrivateRoute>} />
        <Route path="/coach/athletes" element={<PrivateRoute><CoachAthletes /></PrivateRoute>} />
        <Route path="/coach/workouts" element={<PrivateRoute><CoachWorkouts /></PrivateRoute>} />
        <Route path="/coach/workouts/new" element={<PrivateRoute><CreateWorkout /></PrivateRoute>} />
        <Route path="/coach/workouts/import" element={<PrivateRoute><ImportWorkout /></PrivateRoute>} />
        <Route path="/coach/workouts/edit/:id" element={<PrivateRoute><EditWorkout /></PrivateRoute>} />
        <Route path="/coach/events" element={<PrivateRoute><CoachEvents /></PrivateRoute>} />
        <Route path="/coach/stats" element={<PrivateRoute><CoachStats /></PrivateRoute>} />
        <Route path="/coach/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/coach/calendar" element={<PrivateRoute><CoachCalendar /></PrivateRoute>} />
        <Route path="/coach/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
        <Route path="/coach/loop" element={<PrivateRoute><Loop /></PrivateRoute>} />
      </Route>

      {/* Athlete Routes - With Feedback */}
      <Route element={<AthleteLayoutWithFeedback />}> 
        <Route path="/athlete/dashboard" element={<PrivateRoute><AthleteDashboard /></PrivateRoute>} />
        <Route path="/athlete/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/athlete/workouts" element={<PrivateRoute><AthleteWorkouts /></PrivateRoute>} />
        <Route path="/athlete/workouts/edit/:id" element={<PrivateRoute><EditWorkout /></PrivateRoute>} />
        <Route path="/athlete/events" element={<PrivateRoute><AthleteEvents /></PrivateRoute>} />
        <Route path="/athlete/calendar" element={<PrivateRoute><AthleteCalendar /></PrivateRoute>} />
        <Route path="/athlete/stats" element={<PrivateRoute><NotFound /></PrivateRoute>} />
        <Route path="/athlete/nutrition" element={<PrivateRoute><Nutrition /></PrivateRoute>} />
        <Route path="/athlete/sleep" element={<PrivateRoute><Sleep /></PrivateRoute>} />
        <Route path="/athlete/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
        <Route path="/athlete/loop" element={<PrivateRoute><Loop /></PrivateRoute>} />
        <Route path="/gamification" element={<PrivateRoute><GamificationTestPage /></PrivateRoute>} />
      </Route>

      {/* Loop Feature Routes (Accessible to both coaches and athletes) */}
      <Route path="/loop" element={<PrivateRoute><LoopRouteWrapper /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
} 