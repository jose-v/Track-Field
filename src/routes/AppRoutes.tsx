import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import HomeAlt from '../pages/HomeAlt';
import { Login } from '../pages/Login';
import { Signup } from '../pages/Signup';
import { ForgotPassword } from '../pages/ForgotPassword';
import { UpdatePassword } from '../pages/UpdatePassword';
import { VerifyEmail } from '../pages/VerifyEmail';
import { EmailVerified } from '../pages/EmailVerified';
import { Pricing } from '../pages/Pricing';
import { Features } from '../pages/Features';
import { About } from '../pages/About';
import { Contact } from '../pages/Contact';
import { Layout as GeneralLayout } from '../components/Layout';
import { PrivateRoute } from '../components/PrivateRoute';
import { NotFound } from '../pages/NotFound';
import RoleDashboardRouter from '../pages/RoleDashboardRouter';
import Loop from '../pages/Loop';
import LoopRouteWrapper from '../pages/LoopRouteWrapper';
import WorkoutCreatorDemo from '../pages/WorkoutCreatorDemo';
import { Meets } from '../pages/Meets';
import Events from '../pages/Events';
import Account from '../pages/Account';
import SpinnerTest from '../pages/SpinnerTest';
import { CoachInvitation } from '../pages/auth/CoachInvitation';

// Coach pages
import { CoachDashboard } from '../pages/coach/Dashboard';
import { CoachStats } from '../pages/coach/Stats';
import { CoachAthletes } from '../pages/coach/Athletes';
import { CreateWorkout } from '../pages/coach/CreateWorkout';
import { ImportWorkout } from '../pages/coach/ImportWorkout';
import { EditWorkout } from '../pages/coach/EditWorkout';
import { Calendar as CoachCalendar } from '../pages/coach/Calendar';
import CoachProfile from "../pages/coach/Profile";
import { CoachTrainingPlans } from '../pages/coach/TrainingPlans';
import { ManageAthletesPage } from '../pages/coach/ManageAthletesPage';

// Athlete pages
import { Dashboard as AthleteDashboard } from '../pages/Dashboard';
import { Workouts } from '../pages/Workouts';
import { Team } from '../pages/Team';
import { Profile } from '../pages/Profile';
import { AthleteWorkouts } from '../pages/athlete/AthleteWorkouts';
import { Nutrition } from '../pages/athlete/Nutrition';
import { Sleep } from '../pages/athlete/Sleep';
import { Calendar as AthleteCalendar } from '../pages/athlete/Calendar';
import AthleteProfile from "../pages/athlete/Profile";
import Analytics from '../pages/Analytics';

// Features
import { GamificationTestPage } from '../features/gamification';

// Layouts & wrappers
import PublicLayout from '../layouts/PublicLayout';
import AthleteLayoutWithFeedback from '../layouts/AthleteLayoutWithFeedback';
import CoachLayoutWithFeedback from '../layouts/CoachLayoutWithFeedback';

// Notifications
import NotificationsPage from '../pages/NotificationsPage';
import SandboxPage from '../../pages/sandbox';
import TestAuth from '../pages/TestAuth';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Standalone Testing Routes - No Layout */}
      <Route path="sandbox" element={<SandboxPage />} />
      <Route path="test-auth" element={<PrivateRoute><TestAuth /></PrivateRoute>} />

      {/* Protected Dashboard Route - Highest Priority */}
      <Route path="/dashboard" element={<GeneralLayout><PrivateRoute><RoleDashboardRouter /></PrivateRoute></GeneralLayout>} />

      {/* Other Protected Routes (general/unspecified roles) */}
      <Route element={<GeneralLayout><Outlet /></GeneralLayout>}>
        <Route path="/workouts" element={<PrivateRoute><Workouts /></PrivateRoute>} />
        <Route path="/team" element={<PrivateRoute><Team /></PrivateRoute>} />
        <Route path="/private-meets" element={<PrivateRoute><Meets /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      </Route>

      {/* Public Routes */}
      <Route element={<PublicLayout />}>    
        <Route index element={<Home />} />
        <Route path="home-alt" element={<HomeAlt />} />
        <Route path="features" element={<Features />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="meets" element={<Events />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="update-password" element={<UpdatePassword />} />
        <Route path="verify-email" element={<VerifyEmail />} />
        <Route path="email-verified" element={<EmailVerified />} />
        <Route path="spinner-test" element={<SpinnerTest />} />
        <Route path="coach-invitation" element={<CoachInvitation />} />
      </Route>

      {/* Coach Routes - With Feedback */}
      <Route element={<CoachLayoutWithFeedback />}> 
        <Route path="/coach/dashboard" element={<PrivateRoute><CoachDashboard /></PrivateRoute>} />
        <Route path="/coach/athletes" element={<PrivateRoute><CoachAthletes /></PrivateRoute>} />
        <Route path="/coach/manage-athletes" element={<PrivateRoute><ManageAthletesPage /></PrivateRoute>} />
        <Route path="/coach/workouts" element={<PrivateRoute><CoachTrainingPlans /></PrivateRoute>} />
        <Route path="/coach/workouts/new" element={<PrivateRoute><CreateWorkout /></PrivateRoute>} />
        <Route path="/coach/workouts/import" element={<PrivateRoute><ImportWorkout /></PrivateRoute>} />
        <Route path="/coach/workouts/edit/:id" element={<PrivateRoute><EditWorkout /></PrivateRoute>} />
        <Route path="/coach/stats" element={<PrivateRoute><CoachStats /></PrivateRoute>} />
        <Route path="/coach/profile" element={<PrivateRoute><CoachProfile /></PrivateRoute>} />
        <Route path="/coach/calendar" element={<PrivateRoute><CoachCalendar /></PrivateRoute>} />
        <Route path="/coach/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
        <Route path="/coach/loop" element={<PrivateRoute><Loop /></PrivateRoute>} />
        <Route path="/coach/workout-creator" element={<PrivateRoute><WorkoutCreatorDemo /></PrivateRoute>} />
        <Route path="/coach/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
        <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
        <Route path="/coach/meets" element={<PrivateRoute><Meets /></PrivateRoute>} />
        <Route path="/coach/training-plans" element={<PrivateRoute><CoachTrainingPlans /></PrivateRoute>} />
      </Route>

      {/* Athlete Routes - With Feedback */}
      <Route element={<AthleteLayoutWithFeedback />}> 
        <Route path="/athlete/dashboard" element={<PrivateRoute><AthleteDashboard /></PrivateRoute>} />
        <Route path="/athlete/profile" element={<PrivateRoute><AthleteProfile /></PrivateRoute>} />
        <Route path="/athlete/workouts" element={<PrivateRoute><AthleteWorkouts /></PrivateRoute>} />
        <Route path="/athlete/workouts/edit/:id" element={<PrivateRoute><EditWorkout /></PrivateRoute>} />
        <Route path="/athlete/calendar" element={<PrivateRoute><AthleteCalendar /></PrivateRoute>} />
        <Route path="/athlete/stats" element={<PrivateRoute><NotFound /></PrivateRoute>} />
        <Route path="/athlete/nutrition" element={<PrivateRoute><Nutrition /></PrivateRoute>} />
        <Route path="/athlete/sleep" element={<PrivateRoute><Sleep /></PrivateRoute>} />
        <Route path="/athlete/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
        <Route path="/athlete/loop" element={<PrivateRoute><Loop /></PrivateRoute>} />
        <Route path="/gamification" element={<PrivateRoute><GamificationTestPage /></PrivateRoute>} />
        <Route path="/athlete/workout-creator" element={<PrivateRoute><WorkoutCreatorDemo /></PrivateRoute>} />
        <Route path="/athlete/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
        <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
        <Route path="/athlete/meets" element={<PrivateRoute><Meets /></PrivateRoute>} />
      </Route>

      {/* Loop Feature Routes (Accessible to both coaches and athletes) */}
      <Route path="/loop" element={<PrivateRoute><LoopRouteWrapper /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
} 