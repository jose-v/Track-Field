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
  Icon,
  useBreakpointValue
} from '@chakra-ui/react';
import {
  FaCog,
  FaBell,
  FaShieldAlt,
  FaUserMd,
  FaPhone,
  FaSave
} from 'react-icons/fa';
import { useSettings } from '../../hooks/useSettings';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { SettingCard, SettingToggle, SettingSelect, SettingsSidebar } from '../../components/settings';
import type { SettingsSection } from '../../components/settings';
import {
  SettingsFormData,
  NotificationFormData,
  PrivacyFormData
} from '../../types/settings';
import { usePageHeader } from '../../hooks/usePageHeader';

const AthleteSettings = () => {
  usePageHeader({
    title: 'Settings',
    subtitle: 'Manage your preferences and privacy',
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
  const [activeItem, setActiveItem] = useState('general');
  const [mainSidebarWidth, setMainSidebarWidth] = useState(() => {
    // Check localStorage for the saved main sidebar state
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    return savedSidebarState === 'true' ? 70 : 200;
  });

  const { isHeaderVisible } = useScrollDirection(15);

  const isMobile = useBreakpointValue({ base: true, lg: false });

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
          description: 'Medical info and health data'
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
        timeFormat: settings.settings.timeFormat || '12'
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
          );

        case 'privacy':
          return (
            <SettingCard isLoading={isSaving}>
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
          );

        case 'emergency':
          return (
            <SettingCard>
              <VStack spacing={4} align="stretch">
                <Text color={headerSubtextColor}>
                  Emergency contacts feature coming soon. This will allow you to add and manage emergency contacts for safety purposes.
                </Text>
                {/* TODO: Add emergency contacts management */}
              </VStack>
            </SettingCard>
          );

        case 'medical':
          return (
            <SettingCard>
              <VStack spacing={4} align="stretch">
                <Text color={headerSubtextColor}>
                  Medical information feature coming soon. This will allow you to store important medical information like allergies, medications, and emergency medical notes.
                </Text>
                {/* TODO: Add medical information management */}
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
        <Box borderBottom="1px solid" borderColor={useColorModeValue('gray.200', 'gray.700')} w="100vw" position="relative" left="50%" right="50%" style={{ transform: 'translateX(-50%)' }}>
          <HStack spacing={0}>
            {(
              settingsSections.flatMap(section => section.items).map((item) => {
                let label = item.label;
                label = label.replace('Contacts', '').replace('Information', '').trim();
                return (
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
                      color={activeItem === item.id ? 'blue.500' : useColorModeValue('gray.700', 'gray.200')}
                      fontSize="sm"
                    >
                      {label}
                    </Text>
                  </Box>
                );
              })
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
        px={0} // Remove padding since AthleteLayout already adds it
        py={8}
        mx={{ base: '15px', md: 0 }}
      >
        {renderContent()}
      </Box>
    </Box>
  );
};

export default AthleteSettings; 