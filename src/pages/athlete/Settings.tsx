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
  FaSave
} from 'react-icons/fa';
import { MobileHeader } from '../../components';
import { useSettings } from '../../hooks/useSettings';
import { SettingCard, SettingToggle, SettingSelect } from '../../components/settings';
import {
  SettingsFormData,
  NotificationFormData,
  PrivacyFormData
} from '../../types/settings';

const AthleteSettings = () => {
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
    performance_alerts: false,
    email_notifications: true,
    push_notifications: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00'
  });
  
  const [privacyForm, setPrivacyForm] = useState<PrivacyFormData>({
    profile_visibility: 'team_only',
    performance_data_visibility: 'coaches_only',
    allow_coach_contact: true,
    allow_team_invites: true,
    share_workout_data: true,
    share_performance_data: false
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
        title="Settings"
        subtitle="Manage your preferences"
        isLoading={isLoading}
      />

      {/* Desktop Header */}
      <Box display={{ base: "none", lg: "block" }} px={{ base: 4, md: 6 }} pt={6}>
        <Heading size="lg" mb={2} color={headerTextColor}>
          Settings
        </Heading>
        <Text color={headerSubtextColor}>
          Manage your preferences and account settings
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
                      label="Workout Reminders"
                      description="Get notified about upcoming workouts"
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
                      label="Coach Messages"
                      description="Get notified when your coach sends you a message"
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
                      description="Get notified about personal records and achievements"
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
                      description="Who can view your profile information"
                      value={privacyForm.profile_visibility}
                      onChange={(value) => setPrivacyForm(prev => ({ ...prev, profile_visibility: value as any }))}
                      options={visibilityOptions}
                    />
                    
                    <SettingSelect
                      label="Performance Data Visibility"
                      description="Who can view your workout and performance data"
                      value={privacyForm.performance_data_visibility}
                      onChange={(value) => setPrivacyForm(prev => ({ ...prev, performance_data_visibility: value as any }))}
                      options={performanceVisibilityOptions}
                    />
                    
                    <SettingToggle
                      label="Allow Coach Contact"
                      description="Allow coaches to send you messages and invitations"
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
                      description="Allow your workout data to be shared with coaches"
                      isChecked={privacyForm.share_workout_data}
                      onChange={(checked) => setPrivacyForm(prev => ({ ...prev, share_workout_data: checked }))}
                    />
                    
                    <SettingToggle
                      label="Share Performance Data"
                      description="Allow your performance metrics to be shared publicly"
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
                      Emergency contacts feature coming soon. This will allow you to add and manage emergency contacts for safety purposes.
                    </Text>
                    {/* TODO: Add emergency contacts management */}
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
                      Medical information feature coming soon. This will allow you to store important medical information like allergies, medications, and emergency medical notes.
                    </Text>
                    {/* TODO: Add medical information management */}
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

export default AthleteSettings; 