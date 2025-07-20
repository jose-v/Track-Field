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
  Icon,
  useBreakpointValue
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
import PageHeader from '../../components/PageHeader';
import { usePageHeader } from '../../hooks/usePageHeader';
import { useSettings } from '../../hooks/useSettings';
import { SettingCard, SettingToggle, SettingSelect, SettingsSidebar } from '../../components/settings';
import type { SettingsSection } from '../../components/settings';
import {
  SettingsFormData,
  NotificationFormData,
  PrivacyFormData
} from '../../types/settings';

const CoachSettings = () => {
  // Use page header hook
  usePageHeader({
    title: 'Settings',
    subtitle: 'Manage your coaching preferences and privacy',
    icon: FaCog
  });

  const {
    settings,
    isLoading,
    isSaving,
    updateGeneralSettings,
    updateNotificationSettings,
    updatePrivacySettings
  } = useSettings();
  
  // Active section state
  const [activeItem, setActiveItem] = useState('account');
  
  // Form states
  const [generalForm, setGeneralForm] = useState<SettingsFormData>({
    theme: 'system',
    language: 'en',
    timezone: 'America/New_York',
    units: 'imperial',
    timeFormat: '12'
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
  const iconColor = useColorModeValue('blue.500', 'blue.300');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mobileTabTextColor = useColorModeValue('gray.700', 'gray.200');

  const isMobile = useBreakpointValue({ base: true, lg: false });

  // Settings sidebar configuration - New merged structure for mobile-friendly tabs
  const settingsSections: SettingsSection[] = [
    {
      id: 'account',
      title: 'Account Settings',
      items: [
        {
          id: 'account',
          label: 'Account',
          icon: FaCog,
          description: 'General, Privacy, Notifications'
        }
      ]
    },
    {
      id: 'team',
      title: 'Team Management',
      items: [
        {
          id: 'team',
          label: 'Team',
          icon: FaUsers,
          description: 'Team settings'
        }
      ]
    },
    {
      id: 'training',
      title: 'Training & Workouts',
      items: [
        {
          id: 'training',
          label: 'Training',
          icon: FaDumbbell,
          description: 'Workout-related settings'
        }
      ]
    },
    {
      id: 'profile',
      title: 'Profile & Safety',
      items: [
        {
          id: 'profile',
          label: 'Profile',
          icon: FaChartBar,
          description: 'Professional info, Medical, Emergency'
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
        units: settings.settings.units,
        timeFormat: settings.settings.timeFormat
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

  const timeFormatOptions = [
    { value: '12', label: '12-hour (2:30 PM)' },
    { value: '24', label: '24-hour (14:30)' }
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
        case 'account':
          return {
            title: "Account Settings",
            description: "General, Privacy, and Notifications",
            icon: FaCog
          };
        case 'team':
          return {
            title: "Team Management",
            description: "Team settings and athlete management",
            icon: FaUsers
          };
        case 'training':
          return {
            title: "Training & Workouts",
            description: "Workout-related settings and defaults",
            icon: FaDumbbell
          };
        case 'profile':
          return {
            title: "Profile & Safety",
            description: "Professional info, Medical, and Emergency contacts",
            icon: FaChartBar
          };
        default:
          return null;
      }
    };

    const sectionInfo = getSectionInfo();
    if (!sectionInfo) return null;

    const renderCardContent = () => {
      switch (activeItem) {
        case 'account':
          return (
            <VStack spacing={6} align="stretch">
              {/* General Settings Section */}
              <SettingCard isLoading={isSaving}>
                <VStack spacing={4} align="stretch">
                  <Heading size="md" color={headerTextColor}>General Settings</Heading>
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
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <SettingSelect
                      label="Time Format"
                      description="Choose your preferred time format"
                      value={generalForm.timeFormat}
                      onChange={(value) => setGeneralForm(prev => ({ ...prev, timeFormat: value as '12' | '24' }))}
                      options={timeFormatOptions}
                    />
                  </SimpleGrid>
                  
                  <HStack justify="flex-end" pt={4}>
                    <Button
                      colorScheme="blue"
                      onClick={handleGeneralSubmit}
                      isLoading={isSaving}
                      leftIcon={<FaSave />}
                    >
                      Save General
                    </Button>
                  </HStack>
                </VStack>
              </SettingCard>

              {/* Privacy Settings Section */}
              <SettingCard isLoading={isSaving}>
                <VStack spacing={4} align="stretch">
                  <Heading size="md" color={headerTextColor}>Privacy Settings</Heading>
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
                      Save Privacy
                    </Button>
                  </HStack>
                </VStack>
              </SettingCard>

              {/* Notifications Settings Section */}
              <SettingCard isLoading={isSaving}>
                <VStack spacing={4} align="stretch">
                  <Heading size="md" color={headerTextColor}>Notification Settings</Heading>
                  <SettingToggle
                    label="Workout Reminders"
                    description="Receive reminders about upcoming workouts"
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
                      Save Notifications
                    </Button>
                  </HStack>
                </VStack>
              </SettingCard>
            </VStack>
          );

        case 'team':
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
                    Save Team Settings
                  </Button>
                </HStack>
              </VStack>
            </SettingCard>
          );

        case 'training':
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
                    Save Training Settings
                  </Button>
                </HStack>
              </VStack>
            </SettingCard>
          );

        case 'profile':
          return (
            <VStack spacing={6} align="stretch">
              {/* Professional Settings Section */}
              <SettingCard isLoading={isSaving}>
                <VStack spacing={4} align="stretch">
                  <Heading size="md" color={headerTextColor}>Professional Profile</Heading>
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
                      Save Professional
                    </Button>
                  </HStack>
                </VStack>
              </SettingCard>

              {/* Emergency Contacts Section */}
              <SettingCard>
                <VStack spacing={4} align="stretch">
                  <Heading size="md" color={headerTextColor}>Emergency Contacts</Heading>
                  <Text color={headerSubtextColor}>
                    Emergency contacts feature coming soon. This will allow you to add and manage emergency contacts for safety purposes during training sessions and meets.
                  </Text>
                  {/* TODO: REMOVE DUMMY DATA - Add emergency contacts management */}
                </VStack>
              </SettingCard>

              {/* Medical Information Section */}
              <SettingCard>
                <VStack spacing={4} align="stretch">
                  <Heading size="md" color={headerTextColor}>Medical Information</Heading>
                  <Text color={headerSubtextColor}>
                    Medical information feature coming soon. This will allow you to store important medical information and first aid certifications relevant to coaching.
                  </Text>
                  {/* TODO: REMOVE DUMMY DATA - Add medical information management */}
                </VStack>
              </SettingCard>
            </VStack>
          );

        default:
          return null;
      }
    };

    return (
      <VStack spacing={6} align="stretch" w="100%">
        {/* Section Header - Hidden on mobile */}
        <VStack spacing={2} align="start" w="100%" display={{ base: "none", lg: "flex" }}>
          <HStack spacing={3} align="center">
            <Icon
              as={sectionInfo.icon}
              boxSize={6}
              color={iconColor}
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
      {/* Mobile Tab Bar */}
      {isMobile && (
        <Box borderBottom="1px solid" borderColor={borderColor} w="100vw" position="relative" left="50%" right="50%" style={{ transform: 'translateX(-50%)' }}>
          <HStack spacing={0}>
            {(
              settingsSections.flatMap(section => section.items).map((item) => (
                <Box
                  key={item.id}
                  flex="1"
                  py={3}
                  textAlign="center"
                  borderBottom="3px solid"
                  borderColor={activeItem === item.id ? 'blue.500' : 'transparent'}
                  bg="transparent"
                  cursor="pointer"
                  onClick={() => setActiveItem(item.id)}
                >
                  <Text
                    fontWeight={activeItem === item.id ? 'bold' : 'normal'}
                    color={activeItem === item.id ? 'blue.500' : mobileTabTextColor}
                    fontSize="sm"
                  >
                    {item.label}
                  </Text>
                </Box>
              ))
            )}
          </HStack>
        </Box>
      )}
      {/* Desktop Sidebar */}
      {!isMobile && (
        <SettingsSidebar
          sections={settingsSections}
          activeItem={activeItem}
          onItemClick={setActiveItem}
        />
      )}
      {/* Main Content */}
      <Box
        ml={{ 
          base: 0, 
          lg: "280px"
        }}
        mt={{ base: "20px", lg: 0 }}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        minH="100vh"
      >
        {renderContent()}
      </Box>
    </Box>
  );
};

export default CoachSettings; 