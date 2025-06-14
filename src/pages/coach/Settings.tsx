import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  useColorModeValue,
  SimpleGrid,
  Button,
  HStack,
  Container,
  Switch,
  Select,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Divider,
  Badge,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Checkbox,
  CheckboxGroup,
  Stack,
  useToast,
  Icon
} from '@chakra-ui/react';
import {
  FaCog,
  FaBell,
  FaShieldAlt,
  FaUserMd,
  FaPhone,
  FaSave,
  FaUsers,
  FaDumbbell,
  FaChartBar
} from 'react-icons/fa';
import { MobileHeader } from '../../components';
import { useSettings } from '../../hooks/useSettings';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { SettingCard, SettingToggle, SettingSelect, SettingsSidebar } from '../../components/settings';
import type { SettingsSection } from '../../components/settings';
import {
  SettingsFormData,
  NotificationFormData,
  PrivacyFormData
} from '../../types/settings';

const CoachSettings = () => {
  const {
    settings,
    isLoading,
    isSaving,
    updateGeneralSettings,
    updateNotificationSettings,
    updatePrivacySettings
  } = useSettings();
  
  // Active section state
  const [activeItem, setActiveItem] = useState('general');
  
  // Form states
  const [generalForm, setGeneralForm] = useState<SettingsFormData>({
    theme: 'system',
    language: 'en',
    timezone: 'America/New_York',
    units: 'imperial'
  });
  
  const [notificationForm, setNotificationForm] = useState<NotificationFormData>({
    workout_reminders: true,
    meet_updates: true,
    coach_messages: true,
    team_updates: true,
    performance_alerts: true,
    email_notifications: true,
    push_notifications: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00'
  });
  
  const [privacyForm, setPrivacyForm] = useState<PrivacyFormData>({
    profile_visibility: 'public',
    performance_data_visibility: 'public',
    allow_coach_contact: true,
    allow_team_invites: true,
    share_workout_data: true,
    share_performance_data: true
  });

  // Coach-specific form states
  const [teamManagementForm, setTeamManagementForm] = useState({
    default_workout_visibility: 'team_only',
    auto_assign_new_athletes: false,
    require_workout_confirmation: true,
    allow_athlete_modifications: false,
    send_weekly_reports: true,
    athlete_progress_sharing: 'coaches_only'
  });

  const [workoutDefaultsForm, setWorkoutDefaultsForm] = useState({
    default_workout_duration: '60',
    default_rest_periods: '90',
    preferred_units: 'imperial',
    auto_save_templates: true,
    include_warm_up: true,
    include_cool_down: true,
    default_difficulty: 'intermediate'
  });

  const [professionalForm, setProfessionalForm] = useState({
    show_certifications: true,
    public_profile: true,
    accept_new_athletes: true,
    max_athletes: '50',
    specialization_display: true,
    contact_preference: 'app_only'
  });

  // Color mode values
  const pageBackgroundColor = useColorModeValue('gray.50', 'gray.900');
  const headerTextColor = useColorModeValue('gray.800', 'white');
  const headerSubtextColor = useColorModeValue('gray.600', 'gray.300');

  // Settings sidebar configuration
  const settingsSections: SettingsSection[] = [
    {
      id: 'preferences',
      title: 'Preferences',
      items: [
        {
          id: 'general',
          label: 'General',
          icon: FaCog,
          description: 'Theme, language, and basic settings'
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: FaBell,
          description: 'Manage your notification preferences'
        },
        {
          id: 'privacy',
          label: 'Privacy',
          icon: FaShieldAlt,
          description: 'Control your data and visibility'
        }
      ]
    },
    {
      id: 'coaching',
      title: 'Coaching',
      items: [
        {
          id: 'team-management',
          label: 'Team Management',
          icon: FaUsers,
          description: 'Athlete and team settings'
        },
        {
          id: 'workout-defaults',
          label: 'Workout Defaults',
          icon: FaDumbbell,
          description: 'Default workout creation settings'
        },
        {
          id: 'professional',
          label: 'Professional',
          icon: FaChartBar,
          description: 'Professional profile and certifications'
        }
      ]
    },
    {
      id: 'safety',
      title: 'Safety & Support',
      items: [
        {
          id: 'emergency',
          label: 'Emergency Contacts',
          icon: FaPhone,
          description: 'Emergency contact information'
        },
        {
          id: 'medical',
          label: 'Medical Information',
          icon: FaUserMd,
          description: 'Medical info and certifications'
        }
      ]
    }
  ];

  // Update forms when settings load
  React.useEffect(() => {
    if (settings) {
      setGeneralForm({
        theme: settings.settings.theme,
        language: settings.settings.language,
        timezone: settings.settings.timezone,
        units: settings.settings.units
      });
      
      setNotificationForm({
        workout_reminders: settings.notifications.workout_reminders,
        meet_updates: settings.notifications.meet_updates,
        coach_messages: settings.notifications.coach_messages,
        team_updates: settings.notifications.team_updates,
        performance_alerts: settings.notifications.performance_alerts,
        email_notifications: settings.notifications.email_notifications,
        push_notifications: settings.notifications.push_notifications,
        quiet_hours_start: settings.notifications.quiet_hours_start,
        quiet_hours_end: settings.notifications.quiet_hours_end
      });
      
      setPrivacyForm({
        profile_visibility: settings.privacy.profile_visibility,
        performance_data_visibility: settings.privacy.performance_data_visibility,
        allow_coach_contact: settings.privacy.allow_coach_contact,
        allow_team_invites: settings.privacy.allow_team_invites,
        share_workout_data: settings.privacy.share_workout_data,
        share_performance_data: settings.privacy.share_performance_data
      });
    }
  }, [settings]);

  // Option arrays for selects
  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' }
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' }
  ];

  const timezoneOptions = [
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' }
  ];

  const unitsOptions = [
    { value: 'imperial', label: 'Imperial (ft, lbs, °F)' },
    { value: 'metric', label: 'Metric (m, kg, °C)' }
  ];

  const visibilityOptions = [
    { value: 'public', label: 'Public' },
    { value: 'team_only', label: 'Team Only' },
    { value: 'private', label: 'Private' }
  ];

  const performanceVisibilityOptions = [
    { value: 'public', label: 'Public' },
    { value: 'coaches_only', label: 'Coaches Only' },
    { value: 'private', label: 'Private' }
  ];

  const durationOptions = [
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
    { value: '120', label: '2 hours' }
  ];

  const restPeriodOptions = [
    { value: '30', label: '30 seconds' },
    { value: '60', label: '1 minute' },
    { value: '90', label: '1.5 minutes' },
    { value: '120', label: '2 minutes' },
    { value: '180', label: '3 minutes' }
  ];

  const difficultyOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const maxAthleteOptions = [
    { value: '10', label: '10 athletes' },
    { value: '25', label: '25 athletes' },
    { value: '50', label: '50 athletes' },
    { value: '100', label: '100 athletes' },
    { value: 'unlimited', label: 'Unlimited' }
  ];

  const contactPreferenceOptions = [
    { value: 'app_only', label: 'App Only' },
    { value: 'email_allowed', label: 'Email Allowed' },
    { value: 'phone_allowed', label: 'Phone Allowed' },
    { value: 'all_methods', label: 'All Methods' }
  ];

  // Handle form submissions
  const handleGeneralSubmit = async () => {
    await updateGeneralSettings(generalForm);
  };

  const handleNotificationSubmit = async () => {
    await updateNotificationSettings(notificationForm);
  };

  const handlePrivacySubmit = async () => {
    await updatePrivacySettings(privacyForm);
  };

  const handleTeamManagementSubmit = async () => {
    // TODO: REMOVE DUMMY DATA - Implement team management settings update
    console.log('Team management settings:', teamManagementForm);
  };

  const handleWorkoutDefaultsSubmit = async () => {
    // TODO: REMOVE DUMMY DATA - Implement workout defaults settings update
    console.log('Workout defaults settings:', workoutDefaultsForm);
  };

  const handleProfessionalSubmit = async () => {
    // TODO: REMOVE DUMMY DATA - Implement professional settings update
    console.log('Professional settings:', professionalForm);
  };

  // Render content based on active section
  const renderContent = () => {
    const getSectionInfo = () => {
      switch (activeItem) {
        case 'general':
          return {
            title: "Appearance & Language",
            description: "Customize how the app looks and feels",
            icon: FaCog
          };
        case 'notifications':
          return {
            title: "Notification Preferences", 
            description: "Control when and how you receive notifications",
            icon: FaBell
          };
        case 'privacy':
          return {
            title: "Privacy & Data Sharing",
            description: "Control who can see your information and data", 
            icon: FaShieldAlt
          };
        case 'team-management':
          return {
            title: "Team Management Settings",
            description: "Configure how you manage your athletes and teams",
            icon: FaUsers
          };
        case 'workout-defaults':
          return {
            title: "Workout Creation Defaults",
            description: "Set default values for creating new workouts",
            icon: FaDumbbell
          };
        case 'professional':
          return {
            title: "Professional Profile Settings", 
            description: "Manage your professional coaching profile",
            icon: FaChartBar
          };
        case 'emergency':
          return {
            title: "Emergency Contacts",
            description: "Manage your emergency contact information",
            icon: FaPhone
          };
        case 'medical':
          return {
            title: "Medical Information",
            description: "Manage your medical information for safety",
            icon: FaUserMd
          };
        default:
          return null;
      }
    };

    const sectionInfo = getSectionInfo();
    if (!sectionInfo) return null;

    const renderCardContent = () => {
      switch (activeItem) {
        case 'general':
          return (
            <SettingCard isLoading={isSaving}>
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <SettingSelect
                    label="Theme"
                    description="Choose your preferred color scheme"
                    value={generalForm.theme}
                    onChange={(value) => setGeneralForm(prev => ({ ...prev, theme: value as any }))}
                    options={themeOptions}
                  />
                  
                  <SettingSelect
                    label="Language"
                    description="Select your preferred language"
                    value={generalForm.language}
                    onChange={(value) => setGeneralForm(prev => ({ ...prev, language: value }))}
                    options={languageOptions}
                  />
                </SimpleGrid>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <SettingSelect
                    label="Timezone"
                    description="Your local timezone for scheduling"
                    value={generalForm.timezone}
                    onChange={(value) => setGeneralForm(prev => ({ ...prev, timezone: value }))}
                    options={timezoneOptions}
                  />
                  
                  <SettingSelect
                    label="Units"
                    description="Measurement units for distances and weights"
                    value={generalForm.units}
                    onChange={(value) => setGeneralForm(prev => ({ ...prev, units: value as any }))}
                    options={unitsOptions}
                  />
                </SimpleGrid>
                
                <HStack justify="flex-end" pt={4}>
                  <Button
                    colorScheme="blue"
                    onClick={handleGeneralSubmit}
                    isLoading={isSaving}
                    leftIcon={<FaSave />}
                  >
                    Save Changes
                  </Button>
                </HStack>
              </VStack>
            </SettingCard>
          );

        case 'notifications':
          return (
            <SettingCard isLoading={isSaving}>
              <VStack spacing={4} align="stretch">
                <SettingToggle
                  label="Workout Completion Alerts"
                  description="Get notified when athletes complete workouts"
                  isChecked={notificationForm.workout_reminders}
                  onChange={(checked) => setNotificationForm(prev => ({ ...prev, workout_reminders: checked }))}
                />
                
                <SettingToggle
                  label="Meet Updates"
                  description="Receive notifications about track meets and events"
                  isChecked={notificationForm.meet_updates}
                  onChange={(checked) => setNotificationForm(prev => ({ ...prev, meet_updates: checked }))}
                />
                
                <SettingToggle
                  label="Athlete Messages"
                  description="Get notified when athletes send you messages"
                  isChecked={notificationForm.coach_messages}
                  onChange={(checked) => setNotificationForm(prev => ({ ...prev, coach_messages: checked }))}
                />
                
                <SettingToggle
                  label="Team Updates"
                  description="Receive notifications about team announcements"
                  isChecked={notificationForm.team_updates}
                  onChange={(checked) => setNotificationForm(prev => ({ ...prev, team_updates: checked }))}
                />
                
                <SettingToggle
                  label="Performance Alerts"
                  description="Get notified about athlete performance milestones"
                  isChecked={notificationForm.performance_alerts}
                  onChange={(checked) => setNotificationForm(prev => ({ ...prev, performance_alerts: checked }))}
                />
                
                <SettingToggle
                  label="Email Notifications"
                  description="Receive notifications via email"
                  isChecked={notificationForm.email_notifications}
                  onChange={(checked) => setNotificationForm(prev => ({ ...prev, email_notifications: checked }))}
                />
                
                <SettingToggle
                  label="Push Notifications"
                  description="Receive push notifications on your device"
                  isChecked={notificationForm.push_notifications}
                  onChange={(checked) => setNotificationForm(prev => ({ ...prev, push_notifications: checked }))}
                />
                
                <HStack justify="flex-end" pt={4}>
                  <Button
                    colorScheme="blue"
                    onClick={handleNotificationSubmit}
                    isLoading={isSaving}
                    leftIcon={<FaSave />}
                  >
                    Save Changes
                  </Button>
                </HStack>
              </VStack>
            </SettingCard>
          );

        case 'privacy':
          return (
            <SettingCard isLoading={isSaving}>
              <VStack spacing={4} align="stretch">
                <SettingSelect
                  label="Profile Visibility"
                  description="Who can view your coaching profile"
                  value={privacyForm.profile_visibility}
                  onChange={(value) => setPrivacyForm(prev => ({ ...prev, profile_visibility: value as any }))}
                  options={visibilityOptions}
                />
                
                <SettingSelect
                  label="Athlete Data Visibility"
                  description="Who can view your athletes' performance data"
                  value={privacyForm.performance_data_visibility}
                  onChange={(value) => setPrivacyForm(prev => ({ ...prev, performance_data_visibility: value as any }))}
                  options={performanceVisibilityOptions}
                />
                
                <SettingToggle
                  label="Allow Coach Contact"
                  description="Allow other coaches to contact you"
                  isChecked={privacyForm.allow_coach_contact}
                  onChange={(checked) => setPrivacyForm(prev => ({ ...prev, allow_coach_contact: checked }))}
                />
                
                <SettingToggle
                  label="Allow Team Invites"
                  description="Allow team managers to invite you to join teams"
                  isChecked={privacyForm.allow_team_invites}
                  onChange={(checked) => setPrivacyForm(prev => ({ ...prev, allow_team_invites: checked }))}
                />
                
                <SettingToggle
                  label="Share Workout Data"
                  description="Allow sharing of workout templates with other coaches"
                  isChecked={privacyForm.share_workout_data}
                  onChange={(checked) => setPrivacyForm(prev => ({ ...prev, share_workout_data: checked }))}
                />
                
                <SettingToggle
                  label="Share Performance Data"
                  description="Allow sharing of athlete performance data for research"
                  isChecked={privacyForm.share_performance_data}
                  onChange={(checked) => setPrivacyForm(prev => ({ ...prev, share_performance_data: checked }))}
                />
                
                <HStack justify="flex-end" pt={4}>
                  <Button
                    colorScheme="blue"
                    onClick={handlePrivacySubmit}
                    isLoading={isSaving}
                    leftIcon={<FaSave />}
                  >
                    Save Changes
                  </Button>
                </HStack>
              </VStack>
            </SettingCard>
          );

        case 'team-management':
          return (
            <SettingCard isLoading={isSaving}>
              <VStack spacing={4} align="stretch">
                <SettingSelect
                  label="Default Workout Visibility"
                  description="Default visibility for new workouts you create"
                  value={teamManagementForm.default_workout_visibility}
                  onChange={(value) => setTeamManagementForm(prev => ({ ...prev, default_workout_visibility: value }))}
                  options={visibilityOptions}
                />
                
                <SettingToggle
                  label="Auto-assign New Athletes"
                  description="Automatically assign new athletes to your default training plan"
                  isChecked={teamManagementForm.auto_assign_new_athletes}
                  onChange={(checked) => setTeamManagementForm(prev => ({ ...prev, auto_assign_new_athletes: checked }))}
                />
                
                <SettingToggle
                  label="Require Workout Confirmation"
                  description="Athletes must confirm they've completed workouts"
                  isChecked={teamManagementForm.require_workout_confirmation}
                  onChange={(checked) => setTeamManagementForm(prev => ({ ...prev, require_workout_confirmation: checked }))}
                />
                
                <SettingToggle
                  label="Allow Athlete Modifications"
                  description="Athletes can modify workout details (reps, weights, etc.)"
                  isChecked={teamManagementForm.allow_athlete_modifications}
                  onChange={(checked) => setTeamManagementForm(prev => ({ ...prev, allow_athlete_modifications: checked }))}
                />
                
                <SettingToggle
                  label="Send Weekly Reports"
                  description="Automatically send weekly progress reports to athletes"
                  isChecked={teamManagementForm.send_weekly_reports}
                  onChange={(checked) => setTeamManagementForm(prev => ({ ...prev, send_weekly_reports: checked }))}
                />
                
                <SettingSelect
                  label="Athlete Progress Sharing"
                  description="Who can view athlete progress reports"
                  value={teamManagementForm.athlete_progress_sharing}
                  onChange={(value) => setTeamManagementForm(prev => ({ ...prev, athlete_progress_sharing: value }))}
                  options={performanceVisibilityOptions}
                />
                
                <HStack justify="flex-end" pt={4}>
                  <Button
                    colorScheme="blue"
                    onClick={handleTeamManagementSubmit}
                    isLoading={isSaving}
                    leftIcon={<FaSave />}
                  >
                    Save Changes
                  </Button>
                </HStack>
              </VStack>
            </SettingCard>
          );

        case 'workout-defaults':
          return (
            <SettingCard isLoading={isSaving}>
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <SettingSelect
                    label="Default Duration"
                    description="Default workout duration"
                    value={workoutDefaultsForm.default_workout_duration}
                    onChange={(value) => setWorkoutDefaultsForm(prev => ({ ...prev, default_workout_duration: value }))}
                    options={durationOptions}
                  />
                  
                  <SettingSelect
                    label="Default Rest Periods"
                    description="Default rest time between sets"
                    value={workoutDefaultsForm.default_rest_periods}
                    onChange={(value) => setWorkoutDefaultsForm(prev => ({ ...prev, default_rest_periods: value }))}
                    options={restPeriodOptions}
                  />
                </SimpleGrid>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <SettingSelect
                    label="Preferred Units"
                    description="Default units for workout measurements"
                    value={workoutDefaultsForm.preferred_units}
                    onChange={(value) => setWorkoutDefaultsForm(prev => ({ ...prev, preferred_units: value }))}
                    options={unitsOptions}
                  />
                  
                  <SettingSelect
                    label="Default Difficulty"
                    description="Default difficulty level for new workouts"
                    value={workoutDefaultsForm.default_difficulty}
                    onChange={(value) => setWorkoutDefaultsForm(prev => ({ ...prev, default_difficulty: value }))}
                    options={difficultyOptions}
                  />
                </SimpleGrid>
                
                <SettingToggle
                  label="Auto-save Templates"
                  description="Automatically save workouts as templates"
                  isChecked={workoutDefaultsForm.auto_save_templates}
                  onChange={(checked) => setWorkoutDefaultsForm(prev => ({ ...prev, auto_save_templates: checked }))}
                />
                
                <SettingToggle
                  label="Include Warm-up"
                  description="Automatically include warm-up in new workouts"
                  isChecked={workoutDefaultsForm.include_warm_up}
                  onChange={(checked) => setWorkoutDefaultsForm(prev => ({ ...prev, include_warm_up: checked }))}
                />
                
                <SettingToggle
                  label="Include Cool-down"
                  description="Automatically include cool-down in new workouts"
                  isChecked={workoutDefaultsForm.include_cool_down}
                  onChange={(checked) => setWorkoutDefaultsForm(prev => ({ ...prev, include_cool_down: checked }))}
                />
                
                <HStack justify="flex-end" pt={4}>
                  <Button
                    colorScheme="blue"
                    onClick={handleWorkoutDefaultsSubmit}
                    isLoading={isSaving}
                    leftIcon={<FaSave />}
                  >
                    Save Changes
                  </Button>
                </HStack>
              </VStack>
            </SettingCard>
          );

        case 'professional':
          return (
            <SettingCard isLoading={isSaving}>
              <VStack spacing={4} align="stretch">
                <SettingToggle
                  label="Show Certifications"
                  description="Display your coaching certifications on your profile"
                  isChecked={professionalForm.show_certifications}
                  onChange={(checked) => setProfessionalForm(prev => ({ ...prev, show_certifications: checked }))}
                />
                
                <SettingToggle
                  label="Public Profile"
                  description="Make your coaching profile visible to the public"
                  isChecked={professionalForm.public_profile}
                  onChange={(checked) => setProfessionalForm(prev => ({ ...prev, public_profile: checked }))}
                />
                
                <SettingToggle
                  label="Accept New Athletes"
                  description="Allow new athletes to request to join your team"
                  isChecked={professionalForm.accept_new_athletes}
                  onChange={(checked) => setProfessionalForm(prev => ({ ...prev, accept_new_athletes: checked }))}
                />
                
                <SettingToggle
                  label="Display Specializations"
                  description="Show your coaching specializations on your profile"
                  isChecked={professionalForm.specialization_display}
                  onChange={(checked) => setProfessionalForm(prev => ({ ...prev, specialization_display: checked }))}
                />
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <SettingSelect
                    label="Maximum Athletes"
                    description="Maximum number of athletes you'll coach"
                    value={professionalForm.max_athletes}
                    onChange={(value) => setProfessionalForm(prev => ({ ...prev, max_athletes: value }))}
                    options={maxAthleteOptions}
                  />
                  
                  <SettingSelect
                    label="Contact Preference"
                    description="How athletes and parents can contact you"
                    value={professionalForm.contact_preference}
                    onChange={(value) => setProfessionalForm(prev => ({ ...prev, contact_preference: value }))}
                    options={contactPreferenceOptions}
                  />
                </SimpleGrid>
                
                <HStack justify="flex-end" pt={4}>
                  <Button
                    colorScheme="blue"
                    onClick={handleProfessionalSubmit}
                    isLoading={isSaving}
                    leftIcon={<FaSave />}
                  >
                    Save Changes
                  </Button>
                </HStack>
              </VStack>
            </SettingCard>
          );

        case 'emergency':
          return (
            <SettingCard>
              <VStack spacing={4} align="stretch">
                <Text color={headerSubtextColor}>
                  Emergency contacts feature coming soon. This will allow you to add and manage emergency contacts for safety purposes during training sessions and meets.
                </Text>
                {/* TODO: REMOVE DUMMY DATA - Add emergency contacts management */}
              </VStack>
            </SettingCard>
          );

        case 'medical':
          return (
            <SettingCard>
              <VStack spacing={4} align="stretch">
                <Text color={headerSubtextColor}>
                  Medical information feature coming soon. This will allow you to store important medical information and first aid certifications relevant to coaching.
                </Text>
                {/* TODO: REMOVE DUMMY DATA - Add medical information management */}
              </VStack>
            </SettingCard>
          );

        default:
          return null;
      }
    };

    return (
      <VStack spacing={6} align="stretch" w="100%">
        {/* Section Header */}
        <VStack spacing={2} align="start" w="100%">
          <HStack spacing={3} align="center">
            <Icon
              as={sectionInfo.icon}
              boxSize={6}
              color={useColorModeValue('blue.500', 'blue.300')}
            />
            <Heading size="lg" color={headerTextColor}>
              {sectionInfo.title}
            </Heading>
          </HStack>
          <Text color={headerSubtextColor} fontSize="md">
            {sectionInfo.description}
          </Text>
        </VStack>
        
        {/* Card Content */}
        {renderCardContent()}
      </VStack>
    );
  };

  const [mainSidebarWidth, setMainSidebarWidth] = useState(() => {
    // Check localStorage for the saved main sidebar state
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    return savedSidebarState === 'true' ? 70 : 200;
  });

  const { isHeaderVisible } = useScrollDirection(15);

  // Listen for main sidebar toggle events
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      const newWidth = event.detail.width;
      setMainSidebarWidth(newWidth);
    };
    
    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    
    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);

  if (isLoading) {
    return (
      <Box 
        pt={0} 
        pb={10} 
        bg={pageBackgroundColor} 
        minH="100vh"
        w="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={4}>
          <Text color={headerSubtextColor}>Loading settings...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={pageBackgroundColor}>
      <SettingsSidebar
        sections={settingsSections}
        activeItem={activeItem}
        onItemClick={setActiveItem}
      />
      
      {/* Main Content */}
      <Box
        ml={{ 
          base: 0, 
          md: `${mainSidebarWidth - 50}px`, 
          lg: mainSidebarWidth === 70 
            ? `${mainSidebarWidth + 280 - 50}px`  // When collapsed: less margin adjustment
            : `${mainSidebarWidth + 280 - 180}px`  // When expanded: more margin adjustment
        }}
        mr={{ 
          base: 0, 
          lg: mainSidebarWidth === 70 ? "30px" : "20px"  // Less right margin when sidebar is collapsed
        }}
        pt={isHeaderVisible ? "-2px" : "-82px"}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        minH="100vh"
        px={0} // Remove padding since CoachLayout already adds it
        py={8}
      >
        {renderContent()}
      </Box>
    </Box>
  );
};

export default CoachSettings; 