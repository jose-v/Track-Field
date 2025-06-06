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
import { RoleProtectedRoute } from '../components/RoleProtectedRoute';
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

      {/* Coach Routes - With Role Protection */}
      <Route element={<CoachLayoutWithFeedback />}> 
        <Route path="/coach/dashboard" element={<RoleProtectedRoute allowedRoles={['coach', 'team_manager']}><CoachDashboard /></RoleProtectedRoute>} />
        <Route path="/coach/athletes" element={<RoleProtectedRoute allowedRoles={['coach', 'team_manager']}><CoachAthletes /></RoleProtectedRoute>} />

        <Route path="/coach/workouts" element={<RoleProtectedRoute allowedRoles={['coach', 'team_manager']}><CoachTrainingPlans /></RoleProtectedRoute>} />
        <Route path="/coach/workouts/new" element={<RoleProtectedRoute allowedRoles={['coach', 'team_manager']}><CreateWorkout /></RoleProtectedRoute>} />
        <Route path="/coach/workouts/import" element={<RoleProtectedRoute allowedRoles={['coach', 'team_manager']}><ImportWorkout /></RoleProtectedRoute>} />
        <Route path="/coach/workouts/edit/:id" element={<RoleProtectedRoute allowedRoles={['coach', 'team_manager']}><EditWorkout /></RoleProtectedRoute>} />
        <Route path="/coach/stats" element={<RoleProtectedRoute allowedRoles={['coach', 'team_manager']}><CoachStats /></RoleProtectedRoute>} />
        <Route path="/coach/profile" element={<RoleProtectedRoute allowedRoles={['coach', 'team_manager']}><CoachProfile /></RoleProtectedRoute>} />
        <Route path="/coach/calendar" element={<RoleProtectedRoute allowedRoles={['coach', 'team_manager']}><CoachCalendar /></RoleProtectedRoute>} />
        <Route path="/coach/notifications" element={<RoleProtectedRoute allowedRoles={['coach', 'team_manager']}><NotificationsPage /></RoleProtectedRoute>} />
        <Route path="/coach/loop" element={<RoleProtectedRoute allowedRoles={['coach', 'team_manager']}><Loop /></RoleProtectedRoute>} />
        <Route path="/coach/workout-creator" element={<RoleProtectedRoute allowedRoles={['coach', 'team_manager']}><WorkoutCreatorDemo /></RoleProtectedRoute>} />
        <Route path="/coach/analytics" element={<RoleProtectedRoute allowedRoles={['coach', 'team_manager']}><Analytics /></RoleProtectedRoute>} />
        <Route path="/account" element={<RoleProtectedRoute allowedRoles={['coach', 'team_manager']}><Account /></RoleProtectedRoute>} />
        <Route path="/coach/meets" element={<RoleProtectedRoute allowedRoles={['coach', 'team_manager']}><Meets /></RoleProtectedRoute>} />
        <Route path="/coach/training-plans" element={<RoleProtectedRoute allowedRoles={['coach', 'team_manager']}><CoachTrainingPlans /></RoleProtectedRoute>} />
      </Route>

      {/* Athlete Routes - With Role Protection */}
      <Route element={<AthleteLayoutWithFeedback />}> 
        <Route path="/athlete/dashboard" element={<RoleProtectedRoute allowedRoles={['athlete']}><AthleteDashboard /></RoleProtectedRoute>} />
        <Route path="/athlete/profile" element={<RoleProtectedRoute allowedRoles={['athlete']}><AthleteProfile /></RoleProtectedRoute>} />
        <Route path="/athlete/workouts" element={<RoleProtectedRoute allowedRoles={['athlete']}><AthleteWorkouts /></RoleProtectedRoute>} />
        <Route path="/athlete/workouts/edit/:id" element={<RoleProtectedRoute allowedRoles={['athlete']}><EditWorkout /></RoleProtectedRoute>} />
        <Route path="/athlete/calendar" element={<RoleProtectedRoute allowedRoles={['athlete']}><AthleteCalendar /></RoleProtectedRoute>} />
        <Route path="/athlete/stats" element={<RoleProtectedRoute allowedRoles={['athlete']}><NotFound /></RoleProtectedRoute>} />
        <Route path="/athlete/nutrition" element={<RoleProtectedRoute allowedRoles={['athlete']}><Nutrition /></RoleProtectedRoute>} />
        <Route path="/athlete/sleep" element={<RoleProtectedRoute allowedRoles={['athlete']}><Sleep /></RoleProtectedRoute>} />
        <Route path="/athlete/notifications" element={<RoleProtectedRoute allowedRoles={['athlete']}><NotificationsPage /></RoleProtectedRoute>} />
        <Route path="/athlete/loop" element={<RoleProtectedRoute allowedRoles={['athlete']}><Loop /></RoleProtectedRoute>} />
        <Route path="/gamification" element={<RoleProtectedRoute allowedRoles={['athlete']}><GamificationTestPage /></RoleProtectedRoute>} />
        <Route path="/athlete/workout-creator" element={<RoleProtectedRoute allowedRoles={['athlete']}><WorkoutCreatorDemo /></RoleProtectedRoute>} />
        <Route path="/athlete/analytics" element={<RoleProtectedRoute allowedRoles={['athlete']}><Analytics /></RoleProtectedRoute>} />
        <Route path="/account" element={<RoleProtectedRoute allowedRoles={['athlete']}><Account /></RoleProtectedRoute>} />
        <Route path="/athlete/meets" element={<RoleProtectedRoute allowedRoles={['athlete']}><Meets /></RoleProtectedRoute>} />
      </Route>

      {/* Loop Feature Routes (Accessible to both coaches and athletes) */}
      <Route path="/loop" element={<PrivateRoute><LoopRouteWrapper /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
} 