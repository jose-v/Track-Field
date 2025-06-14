import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  SimpleGrid,
  Button,
  HStack
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
import { SettingCard, SettingToggle, SettingSelect } from '../../components/settings';
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
          <Spinner size="xl" color="blue.500" />
          <Text color={headerSubtextColor}>Loading settings...</Text>
        </VStack>
      </Box>
    );
  }

  if (!settings) {
    return (
      <Box 
        pt={0} 
        pb={10} 
        bg={pageBackgroundColor} 
        minH="100vh"
        w="100%"
        p={6}
      >
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          Failed to load settings. Please try refreshing the page.
        </Alert>
      </Box>
    );
  }

  return (
    <Box 
      pt={0} 
      pb={10} 
      bg={pageBackgroundColor} 
      minH="100vh"
      w="100%"
      maxW="100%"
      overflowX="hidden"
    >
      {/* Mobile Header */}
      <MobileHeader
        title="Coach Settings"
        subtitle="Manage your coaching preferences"
        isLoading={isLoading}
      />

      {/* Desktop Header */}
      <Box display={{ base: "none", lg: "block" }} px={{ base: 4, md: 6 }} pt={6}>
        <Heading size="lg" mb={2} color={headerTextColor}>
          Coach Settings
        </Heading>
        <Text color={headerSubtextColor}>
          Manage your coaching preferences and team settings
        </Text>
      </Box>

      <Box maxW="4xl" mx="auto" mt={{ base: "20px", lg: 8 }} px={{ base: 4, md: 6 }}>
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>
              <FaCog style={{ marginRight: '8px' }} />
              General
            </Tab>
            <Tab>
              <FaBell style={{ marginRight: '8px' }} />
              Notifications
            </Tab>
            <Tab>
              <FaShieldAlt style={{ marginRight: '8px' }} />
              Privacy
            </Tab>
            <Tab>
              <FaUsers style={{ marginRight: '8px' }} />
              Team Management
            </Tab>
            <Tab>
              <FaDumbbell style={{ marginRight: '8px' }} />
              Workout Defaults
            </Tab>
            <Tab>
              <FaChartBar style={{ marginRight: '8px' }} />
              Professional
            </Tab>
            <Tab>
              <FaPhone style={{ marginRight: '8px' }} />
              Emergency
            </Tab>
            <Tab>
              <FaUserMd style={{ marginRight: '8px' }} />
              Medical
            </Tab>
          </TabList>

          <TabPanels>
            {/* General Settings Tab */}
            <TabPanel px={0} py={6}>
              <VStack spacing={6} align="stretch">
                <SettingCard
                  title="Appearance & Language"
                  description="Customize how the app looks and feels"
                  icon={FaCog}
                  isLoading={isSaving}
                >
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
              </VStack>
            </TabPanel>

            {/* Notifications Tab */}
            <TabPanel px={0} py={6}>
              <VStack spacing={6} align="stretch">
                <SettingCard
                  title="Notification Preferences"
                  description="Control when and how you receive notifications"
                  icon={FaBell}
                  isLoading={isSaving}
                >
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
                      description="Get notified about athlete PRs and achievements"
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
              </VStack>
            </TabPanel>

            {/* Privacy Tab */}
            <TabPanel px={0} py={6}>
              <VStack spacing={6} align="stretch">
                <SettingCard
                  title="Privacy & Data Sharing"
                  description="Control who can see your information and data"
                  icon={FaShieldAlt}
                  isLoading={isSaving}
                >
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
                      label="Share Workout Templates"
                      description="Allow your workout templates to be shared publicly"
                      isChecked={privacyForm.share_workout_data}
                      onChange={(checked) => setPrivacyForm(prev => ({ ...prev, share_workout_data: checked }))}
                    />
                    
                    <SettingToggle
                      label="Share Team Performance Data"
                      description="Allow your team's performance metrics to be shared"
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
              </VStack>
            </TabPanel>

            {/* Team Management Tab */}
            <TabPanel px={0} py={6}>
              <VStack spacing={6} align="stretch">
                <SettingCard
                  title="Team Management Settings"
                  description="Configure how you manage your athletes and teams"
                  icon={FaUsers}
                  isLoading={isSaving}
                >
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
                      description="Automatically send weekly progress reports"
                      isChecked={teamManagementForm.send_weekly_reports}
                      onChange={(checked) => setTeamManagementForm(prev => ({ ...prev, send_weekly_reports: checked }))}
                    />
                    
                    <SettingSelect
                      label="Athlete Progress Sharing"
                      description="Who can view your athletes' progress data"
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
              </VStack>
            </TabPanel>

            {/* Workout Defaults Tab */}
            <TabPanel px={0} py={6}>
              <VStack spacing={6} align="stretch">
                <SettingCard
                  title="Workout Creation Defaults"
                  description="Set default values for creating new workouts"
                  icon={FaDumbbell}
                  isLoading={isSaving}
                >
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
              </VStack>
            </TabPanel>

            {/* Professional Settings Tab */}
            <TabPanel px={0} py={6}>
              <VStack spacing={6} align="stretch">
                <SettingCard
                  title="Professional Profile Settings"
                  description="Manage your professional coaching profile"
                  icon={FaChartBar}
                  isLoading={isSaving}
                >
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
              </VStack>
            </TabPanel>

            {/* Emergency Contacts Tab */}
            <TabPanel px={0} py={6}>
              <VStack spacing={6} align="stretch">
                <SettingCard
                  title="Emergency Contacts"
                  description="Manage your emergency contact information"
                  icon={FaPhone}
                >
                  <VStack spacing={4} align="stretch">
                    <Text color={headerSubtextColor}>
                      Emergency contacts feature coming soon. This will allow you to add and manage emergency contacts for safety purposes during training sessions and meets.
                    </Text>
                    {/* TODO: REMOVE DUMMY DATA - Add emergency contacts management */}
                  </VStack>
                </SettingCard>
              </VStack>
            </TabPanel>

            {/* Medical Information Tab */}
            <TabPanel px={0} py={6}>
              <VStack spacing={6} align="stretch">
                <SettingCard
                  title="Medical Information"
                  description="Manage your medical information for safety"
                  icon={FaUserMd}
                >
                  <VStack spacing={4} align="stretch">
                    <Text color={headerSubtextColor}>
                      Medical information feature coming soon. This will allow you to store important medical information and first aid certifications relevant to coaching.
                    </Text>
                    {/* TODO: REMOVE DUMMY DATA - Add medical information management */}
                  </VStack>
                </SettingCard>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

export default CoachSettings; 